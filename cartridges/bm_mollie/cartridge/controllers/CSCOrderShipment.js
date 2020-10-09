var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var renderTemplate = require('*/cartridge/scripts/renderTemplateHelper').renderTemplate;

var isShipmentAllowed = function (order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);
};

exports.Start = function () {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (isShipmentAllowed(order) && orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        renderTemplate('order/payment/shipment/order_shipment.isml', {
            orderId: order.orderNo,
            order: result.order
        });
    } else {
        renderTemplate('order/payment/shipment/order_shipment_not_available.isml');
    }
};

exports.Shipment = function () {
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

        paymentService.createShipment(order, lines);
        paymentService.processPaymentUpdate(order);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while creating shipment for order ' + orderId + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_shipment_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.Shipment.public = true;
