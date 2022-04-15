'use strict';

var server = require('server');
var config = require('*/cartridge/scripts/mollieConfig');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    res.setViewData({
        applePayDirectEnabled: config.isApplePayDirectEnabled(),
        applePayDirectType: config.getApplePayDirectPdpType(),
        applePayDirectButtonStyle: config.getApplePayDirectPdpButtonStyle()
    });

    next();
});

module.exports = server.exports();
