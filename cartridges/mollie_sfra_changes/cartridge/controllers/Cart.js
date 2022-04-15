'use strict';

var server = require('server');
var config = require('*/cartridge/scripts/mollieConfig');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    res.setViewData({
        applePayDirectEnabled: config.isApplePayDirectEnabled(),
        applePayDirectType: config.getApplePayDirectCartType(),
        applePayDirectButtonStyle: config.getApplePayDirectCartButtonStyle()
    });

    next();
});

server.append('MiniCartShow', function (req, res, next) {
    res.setViewData({
        applePayDirectEnabled: config.isApplePayDirectEnabled(),
        applePayDirectType: config.getApplePayDirectCartType(),
        applePayDirectButtonStyle: config.getApplePayDirectCartButtonStyle()
    });

    next();
});

module.exports = server.exports();
