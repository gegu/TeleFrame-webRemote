# TeleFrame addon - webRemote

**ATTENTION: Since the TeleFrame addon feature is still under development, this addon currently only works with the branch [feature/addon-interface](https://github.com/LukeSkywalker92/TeleFrame/tree/feature/addon-interface) of Teleframe!**

This is an addon for the great [TeleFrame](https://github.com/LukeSkywalker92/TeleFrame) project, to demonstrate what is possible with the addon interface.

With this addon you can remote control your TeleFrame with a web browser. You get the same output that TeleFrame is currently displaying.

For interaction you have a touchbar like in TeleFrame, with two additional elements for uploading pictures/videos and for full screen display. The touchbar in the web browser also supports mouse clicks.
Without configuration the addon starts a web server on default port 3000.

**SECURITY WARNING: Do not make the web server accessible from the Internet. There will be no user authentication and everybody can access your TeleFrame!**
To implement this, it would be necessary to add user authentication to the server and operate it with SSL.

---
## Installation

To install the **TeleFrame-webRemote**  addon demo open a terminal and execute:

```sh
cd ~/TeleFrame/addons
git clone https://github.com/gegu/TeleFrame-webRemote
cd TeleFrame-webRemote
npm install
../../tools/addon_control.sh enable TeleFrame-webRemote
```

Then Restart TeleFrame. Open a web browser and enter the IP of your TeleFrame including the configured port to remote control your TeleFrame.
For example: http://192.168.0.5:3000

## Configuration options

The following configuration options are available.

| Name                        | Type   | Description                                                                                |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| port                        | number | TCPIP port on which the server should run. _Default_ : 3000                                |
| statusUpdateInterval        | number | milliseconds between polls for status updates. _Default_: 1000                             |
| statusUpdateIntervalOffline | number | milliseconds between polls for status updates, when TeleFrame is offline. _Default_: 10000 |


## Contributing

Please feel free to add [issues](https://github.com/gegu/TeleFrame-webRemote/issues) or send pull requests.

## Thanks!

Special thanks go to the great [TeleFrame](https://github.com/LukeSkywalker92/TeleFrame) project Without it this project would not have been possible.
