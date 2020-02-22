const {AddonBase} = require(`${__dirname}/../../js/addonInterface`);
const checkInstallation = require(`${__dirname}/js/checkInstall`);
const webServer = require(`${__dirname}/js/server`);

class WebRemote extends AddonBase {
  constructor(config) {
    super(config);

    checkInstallation(this.logger);

    this.teleFrameObjects = {}
    this.status = {
      image: (this.images.length > 0 ? this.images[0] : {}),
      fadeTime: 0,
      imagesCount: this.images.length,
      unseenCount: this.getUnseenCount(),
      isPaused: false,
      isMuted: false,
      screenOn: true,
      newImageNotify: false
    };

    // register required listeners
    this.registerListener('teleFrame-ready', teleFrameObjects => {
      this.teleFrameObjects = teleFrameObjects;
      this.updateStatus({ screenOn: teleFrameObjects.screen.screenOn });
    });
    this.registerListener('renderer-ready', () => {
      webServer.runServer(this, config.port || 3000);
    }, true);
    this.registerListener('images-loaded', () => this.updateStatus({ unseenCount: this.getUnseenCount() }));
    this.registerListener(['starImage', 'unstarImage'], index => this.updateStatus({ image: this.images[index]}));
    this.registerListener('paused', isPaused => this.updateStatus({ isPaused: isPaused }));
    this.registerListener('muted', isMuted => this.updateStatus({ isMuted: isMuted }));
    this.registerListener('changingActiveImage', (index, fadeTime) => this.updateStatus({
      image: this.images[index],
      fadeTime: fadeTime
    }));
    this.registerListener('newImage', () => this.updateStatus({
      unseenCount: this.getUnseenCount(),
      image: this.images[0],
      newImageNotify: true
    }));
    this.registerListener('imageUnseenRemoved', () => this.updateStatus({
      unseenCount: 0,
      newImageNotify: false
    }));
    this.registerListener('imageDeleted', () => this.updateStatus({ unseenCount: this.getUnseenCount() }));
    this.registerListener('screenOn', (newStatus) => this.updateStatus({ screenOn: newStatus }));
  }

  /**
   * Returns the unseen images count
   * @return {number} count
   */
  getUnseenCount()  {
    // build the unseen images count
    let unseenCnt = 0;
    this.images.forEach(img => unseenCnt += (img.unseen ? 1 : 0));
    return unseenCnt;
  }

  /**
   * Update the internal status
   * @param  {Object} newStatus [description]
   */
  updateStatus(newStatus) {
    Object.assign(this.status, newStatus);
    this.status.imagesCount = this.images.length;
  }

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = WebRemote
}
