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

var isShipmentAllowed = function (order) {
    const orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED);
};

exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (!isShipmentAllowed(order)) {
        renderTemplate('order/payment/shipment/order_payment_shipment_not_available.isml');
    } else if (orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        renderTemplate('order/payment/shipment/order_payment_shipment.isml', {
            orderId: order.orderNo,
            order: result.order,
        });
    }
};

exports.Shipment = function () {
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

        paymentService.createShipment(order, lines);
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
