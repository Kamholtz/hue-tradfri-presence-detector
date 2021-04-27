require('dotenv').config();

// HUE
const v3 = require('node-hue-api').v3;
const USERNAME = process.env.HUE_BRIDGE_USER;

// TRADFRI
const Tradfri = require('ikea-tradfri');
var credentials = { identity: process.env.TRADFRI_IDENTITY, psk: process.env.TRADFRI_PSK };
var tradfri = new Tradfri(process.env.TRADFRI_IP, credentials);

// Detection
Promise.all([tradfri.connect(), v3.discovery.nupnpSearch()])
	.then(result => {
		console.log(result);
		const [tradfriCredentials, searchResults] = result;

		const host = searchResults[0].ipaddress;
		return v3.api.createLocal(host).connect(USERNAME);
	})
	.then(api => {
		const PRECENCE_SENSOR_ID = 33;
		const TIMEOUT_MAX = 60;
		const KITCHEN_LIGHTS = tradfri.devices.filter(x => x.name.match(/K\d/));

		var timeout = 0;
		var seconds = 0;
		var wasPresent = false;

		function AnyKitchenLightsOn(kitchenLights) {
			return kitchenLights.some(x => x.isOn);
		}

		setInterval(async () => {
			// Sensing
			const presenceSensor = await api.sensors.getSensor(PRECENCE_SENSOR_ID);
			var initialLightsOn = AnyKitchenLightsOn(KITCHEN_LIGHTS);

			if (presenceSensor.presence) {
				timeout = 0;
			} else if (!presenceSensor.presence && initialLightsOn) {
				timeout++;
			}

			// State update
			if (!presenceSensor.presence && timeout > TIMEOUT_MAX && initialLightsOn) {
				// Turn off
				let success = await Promise.all(KITCHEN_LIGHTS.map(x => x.switch(false)));
				if (success) console.log("Lights are off");

				timeout = 0;
			} else if (!wasPresent && presenceSensor.presence && !initialLightsOn) {
				// Turn on
				let success = await Promise.all(KITCHEN_LIGHTS.map(x => x.switch(true)));
				if (success) console.log("Lights are on");
			}

			// Lights on?
			var endLightsOn = AnyKitchenLightsOn(KITCHEN_LIGHTS);

			seconds++;
			wasPresent = presenceSensor.presence;
			console.log(`Total seconds = ${seconds}, Timeout = ${timeout}/${TIMEOUT_MAX}, presence = ${presenceSensor.presence}, lights initially on? = ${initialLightsOn}, lights now on? = ${endLightsOn}`);
		}, 1000);
	});