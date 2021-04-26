require('dotenv').config();

// HUE
const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;

const USERNAME = process.env.HUE_BRIDGE_USER
	// The name of the light we wish to retrieve by name
	, LIGHT_ID = 1
	;

// TRADFRI
const Tradfri = require('ikea-tradfri');
var Identity = { identity: process.env.TRADFRI_IDENTITY, psk: process.env.TRADFRI_PSK};

tradfri = new Tradfri(process.env.TRADFRI_IP, Identity);

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
		const DESK_1 = tradfri.devices[1];
		const DESK_2 = tradfri.devices[2];
		const TIMEOUT_MAX = 15;
		var timeout = 0;
		var seconds = 0;

		setInterval(async () => {
			const presenceSensor = await api.sensors.getSensor(PRECENCE_SENSOR_ID);
			console.log(presenceSensor.name + " presence = " + presenceSensor.presence);

			if (presenceSensor.presence) {
				timeout = 0;
			} else if (!presenceSensor.presence && DESK_1.isOn) {
				timeout++;
			}

			console.log("ON? : " + DESK_1.isOn);

			if (!presenceSensor.presence && timeout > TIMEOUT_MAX && DESK_1.isOn) {
				// Turn off
				let success1 = await DESK_1.switch(false);
				let success2 = await DESK_2.switch(false);
				timeout = 0;
			} else if (presenceSensor.presence && !DESK_1.isOn) {
				// Turn on
				let success1 = await DESK_1.switch(true);
				let success2 = await DESK_2.switch(true);
			}

			seconds++;
			console.log(`Total seconds = ${seconds} , Timeout = ${timeout}/${TIMEOUT_MAX}`);
		}, 1000);
	});