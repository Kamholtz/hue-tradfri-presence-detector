# A Hue Sensor to Tradfri Lights Presence Detector

We have Tradfri bulbs and a Hue motion sensor in the kitchen for switching lights on when someone is present and switching them back off when no one is present. Homekit/Hue automation was unable to keeps the lights on while the kitchen is in use so here is a NodeJS project that does the job!

## Setup

You will need to add a .env file to the root of the project with the following variables:

```bash
HUE_BRIDGE_USER=
HUE_BRIDGE_CLIENT_KEY=
TRADFRI_IDENTITY=
TRADFRI_PSK=
TRADFRI_IP=
```
