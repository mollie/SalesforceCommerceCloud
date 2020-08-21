'use strict';

var Checkout = module.superModule;

var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var URLUtils = require('dw/web/URLUtils');

server.extend(Checkout);

server.prepend('Begin', function (req, res, next) {
    // in case of a user pressing back button, get the orderId from the privacyCache
    var orderId = req.querystring.orderId || req.session.privacyCache.get('orderId');
    if (orderId && !COHelpers.orderExists(orderId)) {
        res.redirect(URLUtils.home().toString());
    } else {
        COHelpers.restoreOpenOrder(orderId);
    }

    next();
});

module.exports = server.exports();
