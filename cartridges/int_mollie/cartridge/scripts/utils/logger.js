var Logger = require('dw/system/Logger');
var config = require('*/cartridge/scripts/mollieConfig');

module.exports = Logger.getLogger(config.getLogCategory());
