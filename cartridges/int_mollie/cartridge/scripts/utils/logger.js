var Logger = require('dw/system/Logger');
const config = require('*/cartridge/scripts/mollieConfig');

module.exports = Logger.getLogger(config.getLogCategory());
