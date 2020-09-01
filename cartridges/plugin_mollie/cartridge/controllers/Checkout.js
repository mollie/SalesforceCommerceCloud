'use strict';

var Checkout = module.superModule;

var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var URLUtils = require('dw/web/URLUtils');
var config = require('*/cartridge/scripts/mollieConfig');
var profileHelper = require('*/cartridge/scripts/profile/profileHelper');

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

server.append('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.mollie = {
        customerId: profileHelper.getProfileCustomerId(req.currentCustomer.raw.profile),
        mollieComponents: {
            profileId: config.getComponentsProfileId(),
            enableTestMode: config.getComponentsEnableTestMode()
        }
    }

    next();
});

module.exports = server.exports();
