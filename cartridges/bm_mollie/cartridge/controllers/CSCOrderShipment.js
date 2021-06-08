'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Checks if shipment is allowed for order
 * @param {string} order - order
 * @returns {boolean}  - is shipment allowed?
 * @throws {MollieServiceException}
 */
function isShipmentAllowed(order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return (orderStatus !== Order.ORDER_STATUS_CANCELLED &&
        orderStatus !== Order.ORDER_STATUS_FAILED &&
        orderStatus !== Order.ORDER_STATUS_CREATED);
}

/**
 * CSCOrderShipment-Start : Renders the shipment options
 * @name Mollie/CSCOrderShipment-Start
 * @function
 * @memberof CSCOrderShipment
 * @param {middleware} - csrfProtection.generateToken
 * @param {renders} - html
 * @param {serverfunction} - get
 */
server.get('Start', csrfProtection.generateToken, function (req, res, next) {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    if (isShipmentAllowed(order) && orderHelper.isMollieOrder(order)) {
        var result = paymentService.getOrder(orderHelper.getOrderId(order));
        res.render('order/payment/shipment/order_shipment.isml', {
            orderId: order.orderNo,
            order: result.order
        });
    } else {
        res.render('order/payment/shipment/order_shipment_not_available.isml');
    }
    return next();
});

/**
 * CSCOrderShipment-Shipment : Handle submit shipping form
 * @name Mollie/CSCOrderShipment-Shipment
 * @function
 * @memberof CSCOrderShipment
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('Shipment', csrfProtection.validateRequest, function (req, res, next) {
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

    res.render('order/payment/shipment/order_shipment_confirmation.isml', viewParams);
    return next();
});

module.exports = server.exports();
