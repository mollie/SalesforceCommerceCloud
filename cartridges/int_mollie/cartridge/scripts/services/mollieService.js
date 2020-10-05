var Mollie = require('*/cartridge/scripts/services/mollie/Mollie');
var createPayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
var getPayment = require('*/cartridge/scripts/services/mollie/payment/getPayment');
var cancelPayment = require('*/cartridge/scripts/services/mollie/payment/cancelPayment');
var paymentConstants = require('*/cartridge/scripts/services/mollie/payment/paymentConstants');

var createOrder = require('*/cartridge/scripts/services/mollie/order/createOrder');
var getOrder = require('*/cartridge/scripts/services/mollie/order/getOrder');
var cancelOrder = require('*/cartridge/scripts/services/mollie/order/cancelOrder');
var cancelOrderLineItem = require('*/cartridge/scripts/services/mollie/order/cancelOrderLineItem');
var orderConstants = require('*/cartridge/scripts/services/mollie/order/orderConstants');

var createOrderRefund = require('*/cartridge/scripts/services/mollie/refund/createOrderRefund');
var createPaymentRefund = require('*/cartridge/scripts/services/mollie/refund/createPaymentRefund');
var refundConstants = require('*/cartridge/scripts/services/mollie/refund/refundConstants');

var createShipment = require('*/cartridge/scripts/services/mollie/shipment/createShipment');
var shipmentConstants = require('*/cartridge/scripts/services/mollie/shipment/shipmentConstants');

var getMethod = require('*/cartridge/scripts/services/mollie/method/getMethod');
var getMethods = require('*/cartridge/scripts/services/mollie/method/getMethods');
var methodConstants = require('*/cartridge/scripts/services/mollie/method/methodConstants');

var createCustomer = require('*/cartridge/scripts/services/mollie/customer/createCustomer');
var customerConstants = require('*/cartridge/scripts/services/mollie/customer/customerConstants');

var requestPaymentSession = require('*/cartridge/scripts/services/mollie/applePay/requestPaymentSession');
var applePayConstants = require('*/cartridge/scripts/services/mollie/applePay/applePayConstants');

exports.createPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.CREATE_PAYMENT);
    mollie.addPayloadBuilder(createPayment.payloadBuilder);
    mollie.addResponseMapper(createPayment.responseMapper);
    return mollie.execute(parameters);
};

exports.getPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.GET_PAYMENT);
    mollie.addPayloadBuilder(getPayment.payloadBuilder);
    mollie.addResponseMapper(getPayment.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.CANCEL_PAYMENT);
    mollie.addPayloadBuilder(cancelPayment.payloadBuilder);
    mollie.addResponseMapper(cancelPayment.responseMapper);
    return mollie.execute(parameters);
};

exports.createOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.CREATE_ORDER);
    mollie.addPayloadBuilder(createOrder.payloadBuilder);
    mollie.addResponseMapper(createOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.getOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.GET_ORDER);
    mollie.addPayloadBuilder(getOrder.payloadBuilder);
    mollie.addResponseMapper(getOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.CANCEL_ORDER);
    mollie.addPayloadBuilder(cancelOrder.payloadBuilder);
    mollie.addResponseMapper(cancelOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelOrderLineItem = function (parameters) {
    var mollie = new Mollie(orderConstants.CANCEL_ORDER_LINE_ITEM);
    mollie.addPayloadBuilder(cancelOrderLineItem.payloadBuilder);
    mollie.addResponseMapper(cancelOrderLineItem.responseMapper);
    return mollie.execute(parameters);
};

exports.createOrderRefund = function (parameters) {
    var mollie = new Mollie(refundConstants.CREATE_ORDER_REFUND);
    mollie.addPayloadBuilder(createOrderRefund.payloadBuilder);
    mollie.addResponseMapper(createOrderRefund.responseMapper);
    return mollie.execute(parameters);
};

exports.createPaymentRefund = function (parameters) {
    var mollie = new Mollie(refundConstants.CREATE_PAYMENT_REFUND);
    mollie.addPayloadBuilder(createPaymentRefund.payloadBuilder);
    mollie.addResponseMapper(createPaymentRefund.responseMapper);
    return mollie.execute(parameters);
};

exports.createShipment = function (parameters) {
    var mollie = new Mollie(shipmentConstants.CREATE_SHIPMENT);
    mollie.addPayloadBuilder(createShipment.payloadBuilder);
    mollie.addResponseMapper(createShipment.responseMapper);
    return mollie.execute(parameters);
};

exports.getMethod = function (parameters) {
    var mollie = new Mollie(methodConstants.GET_METHOD);
    mollie.addPayloadBuilder(getMethod.payloadBuilder);
    mollie.addResponseMapper(getMethod.responseMapper);
    return mollie.execute(parameters);
};

exports.getMethods = function (parameters) {
    var constant = methodConstants.GET_METHODS;
    var mollie = new Mollie(constant);
    mollie.addPayloadBuilder(getMethods.payloadBuilder);
    mollie.addResponseMapper(getMethods.responseMapper);
    return mollie.execute(parameters);
};

exports.getMethodsWithParams = function (parameters) {
    var constant = methodConstants.GET_METHODS_WITH_PARAMS;
    var mollie = new Mollie(constant);
    mollie.addPayloadBuilder(getMethods.payloadBuilder);
    mollie.addResponseMapper(getMethods.responseMapper);
    return mollie.execute(parameters);
};

exports.createCustomer = function (parameters) {
    var mollie = new Mollie(customerConstants.CREATE_CUSTOMER);
    mollie.addPayloadBuilder(createCustomer.payloadBuilder);
    mollie.addResponseMapper(createCustomer.responseMapper);
    return mollie.execute(parameters);
};

exports.requestPaymentSession = function (parameters) {
    var mollie = new Mollie(applePayConstants.REQUEST_PAYMENT_SESSION);
    mollie.addPayloadBuilder(requestPaymentSession.payloadBuilder);
    mollie.addResponseMapper(requestPaymentSession.responseMapper);
    return mollie.execute(parameters);
};
