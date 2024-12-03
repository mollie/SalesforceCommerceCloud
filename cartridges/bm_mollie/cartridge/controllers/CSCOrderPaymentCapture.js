var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderModel = require('*/cartridge/models/order');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');

var renderTemplate = function (templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
};

// TODO: Check if order is authenticated through service
var isCaptureAllowed = function (order) {
    if (!order) return false;
    const orderStatus = order.status.value;
    return orderStatus === Order.ORDER_STATUS_OPEN ||
        orderStatus === Order.ORDER_STATUS_NEW ||
        orderStatus === Order.ORDER_STATUS_COMPLETED;
};

/**
 * CSCOrderPaymentCapture-Start : Renders the capture options
 * @name Mollie/SCSOrderPaymentCapture-Start
 * @function
 * @memberof SCSOrderPaymentCapture
 * @param {middleware} - csrfProtection.generateToken
 * @param {renders} - html
 * @param {serverfunction} - get
 */
exports.Start = function () {
    const orderNo = request.httpParameterMap.get('order_no').stringValue;
    const order = OrderMgr.getOrder(orderNo);

    if (isCaptureAllowed(order) && orderHelper.getOrderIsAuthorized(order)) {
        renderTemplate('order/payment/capture/order_payment_capture.isml', {
            order: new OrderModel(order, {
                containerView: 'order'
            })
        });
    } else {
        renderTemplate('order/payment/capture/order_payment_capture_not_available.isml');
    }
};

exports.Capture = function () {
    const orderNo = request.httpParameterMap.get('orderId').stringValue;
    const paymentMethodID = request.httpParameterMap.get('paymentMethodID').stringValue;
    const amount = request.httpParameterMap.get('amount').stringValue;
    const order = OrderMgr.getOrder(orderNo);

    const viewParams = {
        success: true,
        orderId: orderNo
    };

    try {
        var molliePaymentInstrument = order.paymentInstrument;
        var methodID = molliePaymentInstrument.getPaymentMethod();
        var paymentId = orderHelper.getPaymentId(order, methodID);

        paymentService.createCapture(paymentId, {
            value: amount,
            currency: order.currencyCode || null
        });

        paymentService.processPaymentUpdate(order);
        Logger.debug('PAYMENT :: Payment processed for order ' + orderId);
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while processing payment for order ' + orderNo + '. ' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/capture/order_payment_capture_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.Capture.public = true;
