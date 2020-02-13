const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');
const server = express();
const supportedUploadFileTypes = ['jpg', 'mp4'];
const supportedUploadMimeTypes = ['image/jpeg', 'video/mpeg'];
const teleFramePath = path.resolve(`${__dirname}/../../../`);

// configure server
server.use(fileUpload());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

const runServer = (addonInstance, listenPort) => {

  // server routes

  // status request
  server.get('/status', (req, res) => {
    res.send(JSON.stringify(addonInstance.status));
    if (addonInstance.status.newImageNotify){
      addonInstance.status.newImageNotify = false;
    }
  });

  // TeleFrame config request
  // For security reasons some config keys will be removed
  server.get('/tfconfig/*', (req, res) => {
    let args = `${req.originalUrl.replace(/^\/tfconfig\//, '')}`;
    args = args.split('/');

    // work with a cloned config
    const conf = JSON.parse(JSON.stringify(addonInstance.teleFrameObjects.config));
    // remove some keys for security reasons or if they unneeded
    ['botToken', 'voiceReply', 'whitelistChats',
      'whitelistAdmins', 'adminAction', 'keys']
      .forEach(key => delete conf[key]);
    // send only our own addon config
    conf.addonInterface.addons = { webRemote: addonInstance.config}
    // load  phrases for the requested language
    let index = (args ? args.indexOf('lang') : -1);
    if (index > -1 && args.length > ++index) {
      conf.language = args[index];
    } else {
      // load the phrases for the browsers language
      conf.language = req.headers["accept-language"].split(',')[0].substr(0, 2);
    }
    delete conf.phrases;
    const initLanguage = require(path.resolve(`${teleFramePath}/js/initLanguage.js`));
    initLanguage(conf);
    conf.addonInterface.addons.webRemote.language = conf.language;
    initLanguage(conf.addonInterface.addons.webRemote, path.resolve(`${__dirname}/../config`));

    res.send(JSON.stringify({
      config: conf,
      screen: addonInstance.teleFrameObjects.screen
    }));
  });

  // request to execute a conmmand - send event to TeleFrame
  server.get('/command/*', (req, res) => {
    const command = `${req.originalUrl.replace(/^\/command\//, '')}`;

    switch(command){
      case 'tfScreenToggle':
        if (addonInstance.teleFrameObjects.screen.cmdBacklightOn &&
          addonInstance.teleFrameObjects.screen.cmdBacklightOff) {

          if (addonInstance.teleFrameObjects.screen.screenOn) {
            addonInstance.teleFrameObjects.scheduler.turnMonitorOff();
          } else {
            addonInstance.teleFrameObjects.scheduler.turnMonitorOn();
          }
        }
        res.send(JSON.stringify({status: 'command sent'}));
        break;
      default:
        //  TeleFrame commands
        addonInstance.sendEvent(command);
        res.send(JSON.stringify({status: 'command sent'}));
    }
  });

  // request supported file types to upload
  server.get('/upload/fileTypes', (req, res)  => {
    res.send(JSON.stringify(supportedUploadFileTypes));
  });

  // request uploading asset
  server.post('/upload', async (req, res) => {
    try {
      if(!req.files) {
        res.send({
            status: false,
            message: 'No file uploaded'
        });
      } else {
        let uploadedFile = req.files.asset;
        if (uploadedFile.name.match(new RegExp(`.(${supportedUploadFileTypes.join('|')})$`, 'i'))
            && supportedUploadMimeTypes.indexOf(uploadedFile.mimetype) > -1) {
          //move files to images directory
          const imgDestName = new Date().getTime() + uploadedFile.name.substr(uploadedFile.name.lastIndexOf('.')).toLowerCase();
          let imgDestPath = addonInstance.teleFrameObjects.config.imageFolder;
          // resolve relative paths if needed
          if (imgDestPath.search(/^[.a-z0-9_-]/i) === 0) {
            imgDestPath = path.resolve(`${teleFramePath}/${imgDestPath}/${imgDestName}`);
          }
          let imageSrcTf = `${addonInstance.teleFrameObjects.config.imageFolder}/${imgDestName}`;
          uploadedFile.mv(imgDestPath, err => {
            if (err) {
              addonInstance.logger.error(err.stack);
              return res.status(500).send(err);
            } else {
              if (!req.body.caption) {
                // ensure undefined value for empty strings
                req.body.caption = undefined;
              }
              if (!req.body.sender) {
                // ensure undefined value for empty strings
                req.body.sender = 'Web remote';
              }
              addonInstance.teleFrameObjects.imageWatchdog.newImage(imageSrcTf,
                req.body.sender,
                req.body.caption, 0,
                req.body.sender, 0);
              //push file details
              const data = {
                  name: uploadedFile.name,
                  mimetype: uploadedFile.mimetype,
                  size: uploadedFile.size
              };

              //return response
              res.send({
                  status: true,
                  message: 'File uploaded',
                  data: data
              });
            }
          });
        } else {
          res.status(400).send(`Unsupported type! Send .${supportedUploadFileTypes.join(', .')}`);
          return false;
        }
      }
    } catch (_) {
      res.status(500).send('Server error');
    }
  });

  // folders to serve static files from
  server.use(express.static(path.resolve((`${__dirname}/../public`))));
  server.use(express.static(path.resolve(`${__dirname}/../node_modules`)));
  // use installed node_modules and some assets from TeleFrame to save some space on the raspberries
  server.use(express.static(path.resolve(`${teleFramePath}/node_modules`)));
  // don't send the images.json
  server.use('/images', (req, res, next) => {
    if (req.url.search(/\.json$/) > -1) {
      return res.status(403).send('403 Forbidden');
    }
    next();
  });
  // assets from TeleFrame
  ['images', 'fonts', 'sounds', 'js'].forEach(folder => server.use(`/${folder}`, express.static(path.resolve(`${teleFramePath}/${folder}`))));

  // run the server
  server.listen(listenPort, () => addonInstance.logger.info(`Server listen on port ${listenPort}`))
  .on('error', error => addonInstance.logger.error(error.stack));
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = {
    runServer
  };
}
