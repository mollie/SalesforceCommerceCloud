var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var renderTemplate = require('*/cartridge/scripts/helpers/renderTemplateHelper').renderTemplate;

var isCancelAllowed = function (order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);
};

exports.Start = function () {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (!isCancelAllowed(order)) {
        renderTemplate('order/payment/cancel/order_payment_cancel_not_available.isml');
    } else if (orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        renderTemplate('order/payment/cancel/order_payment_cancel_order.isml', {
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
            renderTemplate('order/payment/cancel/order_payment_cancel_payment.isml', {
                orderId: order.orderNo,
                payments: payments
            });
        } else {
            renderTemplate('order/payment/cancel/order_payment_cancel_not_available.isml');
        }
    }
};

exports.CancelPayment = function () {
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

    renderTemplate('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
};

exports.CancelOrderLine = function () {
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

    renderTemplate('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
};

exports.CancelOrder = function () {
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

    renderTemplate('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.CancelPayment.public = true;
exports.CancelOrderLine.public = true;
exports.CancelOrder.public = true;
