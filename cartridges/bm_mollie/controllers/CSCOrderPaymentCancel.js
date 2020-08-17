var ISML = require('dw/template/ISML');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var OrderModel = require('*/cartridge/models/order');
var Logger = require('*/cartridge/scripts/utils/logger');
var paymentService = require('*/cartridge/scripts/payment/paymentService');

var renderTemplate = function (templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
};

var isCancelAllowed = function (orderNo) {
    const order = OrderMgr.getOrder(orderNo);
    if (!order) return false;

    const orderStatus = order.status.value;
    var isCancelAllowed = (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);

    var result = paymentService.getPaymentOrOrder(order);
    return isCancelAllowed && result.isCancelable;
};

exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;

    if (!isCancelAllowed(orderNo)) {
        renderTemplate('order/payment/cancel/order_payment_cancel_not_available.isml');
    } else {
        var order = OrderMgr.getOrder(orderNo);

        renderTemplate('order/payment/cancel/order_payment_cancel.isml', {
            order: new OrderModel(order, {
                containerView: 'order'
            })
        });
    }
};

exports.Cancel = function () {
    const orderNo = request.httpParameterMap.get('orderId').stringValue;
    const order = OrderMgr.getOrder(orderNo);

    const viewParams = {
        success: true,
        orderId: orderNo
    };

    try {
        paymentService.cancelPaymentOrOrder(order);
        Logger.debug('PAYMENT :: Cancel processed for order ' + order.orderNo);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while canceling order ' + orderNo + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/cancel/order_payment_cancel_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.Cancel.public = true;
