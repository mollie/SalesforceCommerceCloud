'use strict';

var server = require('server');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderMgr = require('dw/order/OrderMgr');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');

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
    var order = OrderMgr.getOrder(req.querystring.id);
    var transactionPaymentId = orderHelper.getTransactionPaymentId(order);
    var url = paymentService.handlePaymentUpdate(transactionPaymentId);
    res.redirect(url);
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
    paymentService.handlePaymentUpdate(req.body.id);
    res.json({
        success: true
    })
    return next();
});

module.exports = server.exports();
