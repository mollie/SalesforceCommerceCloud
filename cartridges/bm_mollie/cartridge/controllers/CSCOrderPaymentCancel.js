var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var renderTemplate = require('*/cartridge/scripts/helpers/renderTemplateHelper').renderTemplate;

var isCancelAllowed = function (order) {
    const orderStatus = order.getStatus().value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED);
};

exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;
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
    const paymentId = request.httpParameterMap.get('paymentId').stringValue;
    const orderId = request.httpParameterMap.get('orderId').stringValue;
    const viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        paymentService.cancelPayment(paymentId);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating shipment for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_shipment_confirmation.isml', viewParams);
};

exports.CancelOrderLine = function () {
    const quantity = request.httpParameterMap.get('quantity').stringValue;
    const lineId = request.httpParameterMap.get('lineId').stringValue;
    const orderId = request.httpParameterMap.get('orderId').stringValue;
    const order = OrderMgr.getOrder(orderId);
    const viewParams = {
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
        Logger.error('PAYMENT :: ERROR :: Error while creating shipment for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_shipment_confirmation.isml', viewParams);
};

exports.CancelOrder = function () {
    const orderId = request.httpParameterMap.get('orderId').stringValue;
    const order = OrderMgr.getOrder(orderId);
    const viewParams = {
        success: true,
        orderId: order.orderNo
    };

    try {
        paymentService.cancelOrder(order);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating shipment for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_shipment_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.CancelPayment.public = true;
exports.CancelOrderLine.public = true;
exports.CancelOrder.public = true;
