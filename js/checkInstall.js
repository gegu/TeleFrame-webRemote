const fs = require('fs');
const path = require('path');

/**
 * Check if added web packages are avaiable
 * @param  {Object} logger Winston logger
 */
const checkInstallation = (logger) => {
  const missingWebPackages = [];
  // directory checks
  [`${__dirname}/../node_modules/hammerjs`, 'asdfcn/Test'].forEach(file => {
    if (!fs.existsSync(file)) {
      missingWebPackages.push(file.replace(/.*\/+(.*)/, '$1'));
    }
  });
  if (missingWebPackages.length) {
    logger.warn(`Your installation is outdated! Missing packages: ${missingWebPackages.join(', ')}. To update execute:
cd ${path.resolve(__dirname + '/..')} && npm install`);
  }
}

module.name = 'checkInstall';
module.exports = checkInstallation;
