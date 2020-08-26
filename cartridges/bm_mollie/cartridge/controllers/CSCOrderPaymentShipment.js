var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderModel = require('*/cartridge/models/order');
var Logger = require('*/cartridge/scripts/utils/logger');

var renderTemplate = function (templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
};

var isShipmentAllowed = function (orderNo) {
    const order = OrderMgr.getOrder(orderNo);
    if (!order) return false;

    const orderStatus = order.status.value;
    var isShipmentAllowed = (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);

    var result = paymentService.getPaymentOrOrder(order);
    return isShipmentAllowed && result.isShippable;
};

exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;
    if (!isShipmentAllowed(orderNo)) {
        renderTemplate('order/payment/shipment/order_payment_shipment_not_available.isml');
    } else {
        var order = OrderMgr.getOrder(orderNo);

        renderTemplate('order/payment/shipment/order_payment_shipment.isml', {
            order: new OrderModel(order, {
                containerView: 'order'
            })
        });
    }
};

exports.Shipment = function () {
    const orderNo = request.httpParameterMap.get('orderId').stringValue;
    const order = OrderMgr.getOrder(orderNo);

    const viewParams = {
        success: true,
        orderId: orderNo
    };

    try {
        paymentService.createShipment(order);
        Logger.debug('PAYMENT :: Payment processed for order ' + order.orderNo);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while capturing payment for order ' + orderNo + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_shipment_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.Shipment.public = true;
