'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Checks if refund is allowed for order
 * @param {dw.order.Order} order - order
 * @returns {boolean} - is refund allowed?
 */
function isRefundAllowed(order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);
}

/**
 * CSCOrderPaymentRefund-Start : Renders the refund options
 * @name Mollie/CSCOrderPaymentRefund-Start
 * @function
 * @memberof CSCOrderPaymentRefund
 * @param {middleware} - csrfProtection.generateToken
 * @param {renders} - html
 * @param {serverfunction} - get
 */
server.get('Start', csrfProtection.generateToken, function (req, res, next) {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (!isRefundAllowed(order)) {
        res.render('order/payment/refund/order_payment_refund_not_available.isml');
    } else if (orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        res.render('order/payment/refund/order_payment_refund_order.isml', {
            orderId: order.orderNo,
            order: result.order
        });
        paymentService.processPaymentUpdate(order);
    } else {
        var mollieInstruments = orderHelper.getMolliePaymentInstruments(order);
        var payments = mollieInstruments.map(function (instrument) {
            var paymentMethodId = instrument.getPaymentMethod();
            var paymentId = orderHelper.getPaymentId(order, paymentMethodId);
            return paymentService.getPayment(paymentId).payment;
        });
        if (payments.length) {
            res.render('order/payment/refund/order_payment_refund_payment.isml', {
                orderId: order.orderNo,
                payments: payments
            });
            paymentService.processPaymentUpdate(order);
        } else {
            res.render('order/payment/cancel/order_payment_refund_not_available.isml');
        }
    }
    return next();
});

/**
 * CSCOrderPaymentRefund-RefundPayment : Handle refund payment request
 * @name Mollie/CSCOrderPaymentRefund-RefundPayment
 * @function
 * @memberof CSCOrderPaymentRefund
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('RefundPayment', csrfProtection.validateRequest, function (req, res, next) {
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var paymentId = request.httpParameterMap.get('paymentId').stringValue;
    var amount = request.httpParameterMap.get('amount').stringValue;
    var currency = request.httpParameterMap.get('currency').stringValue;
    var viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        paymentService.createPaymentRefund(paymentId, {
            value: amount,
            currency: currency
        });
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating refund for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    res.render('order/payment/refund/order_payment_refund_confirmation.isml', viewParams);
    return next();
});

/**
 * CSCOrderPaymentRefund-RefundOrder : Handle refund order request
 * @name Mollie/CSCOrderPaymentRefund-RefundOrder
 * @function
 * @memberof CSCOrderPaymentRefund
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('RefundOrder', csrfProtection.validateRequest, function (req, res, next) {
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var lineId = request.httpParameterMap.get('lineId').stringValue;
    var quantity = request.httpParameterMap.get('quantity').stringValue;
    var order = OrderMgr.getOrder(orderId);
    var viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        var lines;
        if (quantity && lineId) {
            lines = [{
                id: lineId,
                quantity: quantity
            }];
        }
        paymentService.createOrderRefund(order, lines);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating refund for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    res.render('order/payment/refund/order_payment_refund_confirmation.isml', viewParams);
    return next();
});

module.exports = server.exports();
