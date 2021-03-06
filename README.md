# TeleFrame addon - webRemote

This is an addon for the great [TeleFrame](https://github.com/LukeSkywalker92/TeleFrame) project, to demonstrate what is possible with the addon interface.

With this addon you can remote control your TeleFrame with a web browser. You get the same output that TeleFrame is currently displaying, with a responsive interface.

For interaction you have a touchbar like in TeleFrame by default, with additional elements to

- toggle screen on/off when commands for screen on/off are defined in TeleFrame.
- uploading pictures/videos
- toggle full screen display (Works also with double click or with double tap)

The touchbar elements for the web interface can be adjusted separately in the [configuration](#configuration-options).

**Gestures**

The following touch and mouse gestures are supported:

| Gesture     | Touch       | Mouse support | Description                   |
| ----------- | ----------- | ------------- | ----------------------------- |
| Swipe left  | one finger  | yes           | show the next image/video     |
| Swipe right | one finger  | yes           | show the previous image/video |
| Spread      | two fingers | no            | Zooms the image/video in      |
| Pinch       | two fingers | no            | Zooms the image/video out     |

**To use a mouse for the swipe gestures:**
Move in the wanted direction while keeping the left button down and release the button during the movement.

**Web server port**
Without configuration the addon starts a web server on default port 3000.

**SECURITY WARNING: Do not make the web server accessible from the Internet. There will be no user authentication and everybody can access your TeleFrame!**
To implement this, it would be necessary to add user authentication to the server and operate it with SSL or use a VPN connection.

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
For example: `http://192.168.0.5:3000`

## Update

To update the **TeleFrame-webRemote**  addon demo open a terminal and execute:

```sh
cd ~/TeleFrame/addons/TeleFrame-webRemote
git pull
npm install
```

## Configuration options

The following configuration options are available.

| Name                        | Type   | Default Value                             | Description                                                                                    |
| --------------------------- | ------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| port                        | number | 3000                                      | TCPIP port on which the server should run.                                                     |
| statusUpdateInterval        | number | 1000                                      | milliseconds between polls for status updates.                                                 |
| statusUpdateIntervalOffline | number | 10000                                     | milliseconds between polls for status updates, when TeleFrame is offline.                      |
| touchBarElements            | array  | from TeleFrame `config.touchBar.elements` | Strings to define the touchbar elements to be used. See the list below for available elements. |

### Available Touchbar elements

| Name           | description                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| showNewest     | Show the newest image                                                                                 |
| previousImage  | Show the previous image                                                                               |
| playPause      | Toggle play/pause                                                                                     |
| nextImage      | Show the next image                                                                                   |
| starImage      | Toggle the current image starred/unstarred                                                            |
| deleteImage    | Delete the current image                                                                              |
| mute           | Mute sound output                                                                                     |
| shutdown       | Shutdown TeleFrame                                                                                    |
| reboot         | Reboot TeleFrame                                                                                      |
| tfScreenToggle | _Additional_: Toggle TeleFrame screen on/off - Only available when screen switch commands are defined |
| upload         | _Additional_: Upload image/video to TeleFrame                                                         |
| fullscreen     | _Additional_: Toggle fullscreen view                                                                  |


### Headless setup

You have an old phone to spare which you want to setup as digital photo frame but have no screen connected to the server itself?

Create a virtual screen by executing the following command. Adjust the screen ID (:X) to your needs.

```sh
Xvfb :1 -screen 0 1920x1080x24+32 -fbdir /var/tmp
```
With the virtual screen running, you can now run the TeleFrame command. Make sure to use the same screen ID.
```sh
~/TeleFrame$ DISPLAY=:1 nohup npm start &
```
Success! The interface is now accessible on the port you defined.

## Contributing

Please feel free to add [issues](https://github.com/gegu/TeleFrame-webRemote/issues) or send pull requests.

## Thanks!

Special thanks go to the great [TeleFrame](https://github.com/LukeSkywalker92/TeleFrame) project Without it this project would not have been possible.
