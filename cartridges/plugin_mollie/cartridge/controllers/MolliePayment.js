'use strict';

var server = require('server');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderMgr = require('dw/order/OrderMgr');
var ServiceException = require('*/cartridge/scripts/exceptions/ServiceException');
var URLUtils = require('dw/web/URLUtils');

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
            var url = paymentService.getRedirectUrl(order);
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
        throw ServiceException.from(error);
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
            paymentService.handleStatusUpdate(order, statusUpdateId);
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }

    return next();
});

module.exports = server.exports();
