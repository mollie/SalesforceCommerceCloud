'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Checks if order is cancelable
 * @param {dw.order.Order} order - order
 * @returns {boolean} - is cancel allowed?
 */
function isCancelAllowed(order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED);
}

/**
 * CSCOrderPaymentCancel-Start : Renders the payment cancel page
 * @name Mollie/CSCOrderPaymentCancel-Start
 * @function
 * @memberof CSCOrderPaymentCancel
 * @param {middleware} - csrfProtection.generateToken
 * @param {renders} - html
 * @param {serverfunction} - get
 */
server.get('Start', csrfProtection.generateToken, function (req, res, next) {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (!isCancelAllowed(order)) {
        res.render('order/payment/cancel/order_payment_cancel_not_available.isml');
    } else if (orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        res.render('order/payment/cancel/order_payment_cancel_order.isml', {
            orderId: order.orderNo,
            order: result.order
        });
    } else {
        var mollieInstruments = orderHelper.getMolliePaymentInstruments(order);
        var payments = mollieInstruments.map(function (instrument) {
            var paymentMethodId = instrument.getPaymentMethod();
            var paymentId = orderHelper.getPaymentId(order, paymentMethodId);
            return paymentService.getPayment(paymentId).payment;
        });
        if (payments.length) {
            res.render('order/payment/cancel/order_payment_cancel_payment.isml', {
                orderId: order.orderNo,
                payments: payments
            });
        } else {
            res.render('order/payment/cancel/order_payment_cancel_not_available.isml');
        }
    }
    return next();
});

/**
 * CSCOrderPaymentCancel-CancelPayment : Handles cancel payment request
 * @name Mollie/CSCOrderPaymentCancel-CancelPayment
 * @function
 * @memberof CSCOrderPaymentCancel
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('CancelPayment', csrfProtection.validateRequest, function (req, res, next) {
    var paymentId = request.httpParameterMap.get('paymentId').stringValue;
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        paymentService.cancelPayment(paymentId);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while canceling order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    res.render('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
    return next();
});

/**
 * CSCOrderPaymentCancel-CancelOrderLine : Handles cancel order line request
 * @name Mollie/CSCOrderPaymentCancel-CancelOrderLine
 * @function
 * @memberof CSCOrderPaymentCancel
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('CancelOrderLine', csrfProtection.validateRequest, function (req, res, next) {
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var lineId = request.httpParameterMap.get('lineId').stringValue;
    var quantity = request.httpParameterMap.get('quantity').stringValue;
    var order = OrderMgr.getOrder(orderId);
    var viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        paymentService.cancelOrderLineItem(order, [{
            id: lineId,
            quantity: quantity
        }]);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while canceling order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    res.render('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
    return next();
});

/**
 * CSCOrderPaymentCancel-CancelOrder : Handles cancel order request
 * @name Mollie/CSCOrderPaymentCancel-CancelOrder
 * @function
 * @memberof CSCOrderPaymentCancel
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('CancelOrder', csrfProtection.validateRequest, function (req, res, next) {
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var order = OrderMgr.getOrder(orderId);
    var viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        paymentService.cancelOrder(order);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while canceling order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    res.render('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
    return next();
});

module.exports = server.exports();
