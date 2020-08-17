var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderRefundModel = require('*/cartridge/models/orderRefund');
var Logger = require('*/cartridge/scripts/utils/logger');

var renderTemplate = function (templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
};

var isRefundAllowed = function (orderNo) {
    const order = OrderMgr.getOrder(orderNo);
    if (!order) return false;
    
    const orderStatus = order.status.value;
    var isRefundAllowed = (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);
    
    var result = paymentService.getPaymentOrOrder(order);
    return isRefundAllowed && result.isRefundable;
};

exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;

    if (!isRefundAllowed(orderNo)) {
        renderTemplate('order/payment/refund/order_payment_refund_not_available.isml');
    } else {
        renderTemplate('order/payment/refund/order_payment_refund.isml', {
            orderId: orderNo,
            transactions: new OrderRefundModel().getTransactions(orderNo)
        });
    }
};

exports.Refund = function () {
    const orderNo = request.httpParameterMap.get('orderId').stringValue;
    const refundAmount = request.httpParameterMap.get('refundAmount').stringValue;
    const currencyCode = request.httpParameterMap.get('currencyCode').stringValue;
    const paymentMethodID = request.httpParameterMap.get('paymentMethodID').stringValue;
    const order = OrderMgr.getOrder(orderNo);

    const viewParams = {
        success: true,
        orderId: orderNo,
        refundAmount: refundAmount,
        currencyCode: currencyCode
    };

    try {
        var paymentInstrument = order.getPaymentInstruments(paymentMethodID).toArray()[0];
        paymentService.createRefund(order, paymentInstrument, Number(refundAmount));
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while refunding payment for order ' + orderNo + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    viewParams.transactions = new OrderRefundModel().getTransactions(orderNo);

    renderTemplate('order/payment/refund/order_payment_refund_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.Refund.public = true;
