var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');

var renderTemplate = function (templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
};

var isRefundAllowed = function (order) {
    const orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED);
};

var getRefundableLines = function (serviceResult) {
    return serviceResult.order.lines.filter(function (line) {
        return line.refundableQuantity >= 1;
    });
};

exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        var refundableLines = getRefundableLines(result);
        if (!(isRefundAllowed(order) || refundableLines.length || result.order.isRefundable())) {
            renderTemplate('order/payment/refund/order_payment_refund_not_available.isml');
        } else {
            renderTemplate('order/payment/refund/order_payment_refund_order.ismll', {
                orderId: order.orderNo,
                order: result.order,
                refundableLines: refundableLines
            });
        }
    } else {
        var mollieInstruments = orderHelper.filterMollieInstruments(order);
        var payments = mollieInstruments.map(function (instrument) {
            var paymentMethodId = instrument.getPaymentMethod();
            var paymentId = orderHelper.getPaymentId(order, paymentMethodId);
            return paymentService.getPayment(paymentId);
        });

        renderTemplate('order/payment/refund/order_payment_refund_payment.isml', {
            orderId: order.orderNo,
            payments: payments
        });
    }
};

exports.RefundPayment = function () {
    const orderId = request.httpParameterMap.get('orderId').stringValue;
    const paymentId = request.httpParameterMap.get('paymentId').stringValue;
    const amount = request.httpParameterMap.get('amount').stringValue;
    const order = OrderMgr.getOrder(orderId);
    const viewParams = {
        success: true,
        orderId: order.orderNo
    };

    try {
        paymentService.createPaymentRefund(paymentId, amount);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating shipment for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_shipment_confirmation.isml', viewParams);
};

exports.RefundOrder = function () {
    const quantity = request.httpParameterMap.get('quantity').stringValue;
    const lineId = request.httpParameterMap.get('lineId').stringValue;
    const orderId = request.httpParameterMap.get('orderId').stringValue;
    const order = OrderMgr.getOrder(orderId);
    const viewParams = {
        success: true,
        orderId: order.orderNo
    };

    try {
        var lines;
        if (quantity && lineId) {
            lines = [{
                id: lineId,
                quantity: quantity,
            }];
        }
        paymentService.createOrderRefund(order, lines);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating shipment for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_shipment_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.Shipment.public = true;
