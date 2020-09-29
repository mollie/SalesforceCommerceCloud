'use strict';

var server = require('server');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderMgr = require('dw/order/OrderMgr');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var URLUtils = require('dw/web/URLUtils');
var MollieService = require('*/cartridge/scripts/services/mollieService');
var Resource = require('dw/web/Resource');

/**
 * Handling of a payment hook.
 * Redirects to order confirmation or order failure page.
 *
 * @param {Object} req - The request
 * @param {Object} res - The response
 * @param {Object} next - The next object
 * @return {Object} returns the next object
 */
server.get('Redirect', server.middleware.https, function (req, res, next) {
    try {
        var orderId = req.querystring.orderId;
        var order = orderId && OrderMgr.getOrder(orderId);
        if (order) {
            var url = paymentService.processPaymentUpdate(order);
            if (url) {
                res.redirect(url);
            } else {
                res.redirect(URLUtils.home().toString());
            }
        } else {
            res.redirect(URLUtils.home().toString());
        }
    } catch (e) {
        var error = e;
        if (error.name === 'PaymentProviderException') throw error;
        throw MollieServiceException.from(error);
    }

    return next();
});

/**
 * Handling of a payment hook.
 * Hook for handling Mollie update status call
 *
 * @param {Object} req - The request
 * @param {Object} res - The response
 * @param {Object} next - The next object
 * @return {Object} returns the next object
 */
server.post('Hook', server.middleware.https, function (req, res, next) {
    try {
        var orderId = req.querystring.orderId;
        var statusUpdateId = req.form && req.form.id;
        var order = orderId && OrderMgr.getOrder(orderId);
        if (order && statusUpdateId) {
            paymentService.processPaymentUpdate(order, statusUpdateId);
            res.json({ success: true });
        } else {
            res.json({ success: false, error: Resource.msg('error.missing.params', null, 'mollie') });
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }

    return next();
});

/**
 * Handling of pay with Apple Pay
 *
 * @param {Object} req - The request
 * @param {Object} res - The response
 * @param {Object} next - The next object
 * @return {Object} returns the next object
 */
server.post('ApplePay', server.middleware.https, function (req, res, next) {
    try {
        var validationURL = req.body.validationURL;
        var result = MollieService.requestPaymentSession({
            validationURL: validationURL
        });

        res.json({
            success: true,
            paymentSession: result
        });
    } catch (e) {
        var error = e;
        if (error.name === 'PaymentProviderException') throw error;
        throw MollieServiceException.from(error);
    }

    return next();
});

module.exports = server.exports();
