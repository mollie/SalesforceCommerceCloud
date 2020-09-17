const Mollie = require('*/cartridge/scripts/services/mollie/Mollie');
const createPayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
const getPayment = require('*/cartridge/scripts/services/mollie/payment/getPayment');
const cancelPayment = require('*/cartridge/scripts/services/mollie/payment/cancelPayment');
const paymentConstants = require('*/cartridge/scripts/services/mollie/payment/paymentConstants');

const createOrder = require('*/cartridge/scripts/services/mollie/order/createOrder');
const getOrder = require('*/cartridge/scripts/services/mollie/order/getOrder');
const cancelOrder = require('*/cartridge/scripts/services/mollie/order/cancelOrder');
const cancelOrderLineItem = require('*/cartridge/scripts/services/mollie/order/cancelOrderLineItem');
const orderConstants = require('*/cartridge/scripts/services/mollie/order/orderConstants');

const createOrderRefund = require('*/cartridge/scripts/services/mollie/refund/createOrderRefund');
const createPaymentRefund = require('*/cartridge/scripts/services/mollie/refund/createPaymentRefund');
const refundConstants = require('*/cartridge/scripts/services/mollie/refund/refundConstants');

const createShipment = require('*/cartridge/scripts/services/mollie/shipment/createShipment');
const shipmentConstants = require('*/cartridge/scripts/services/mollie/shipment/shipmentConstants');

const getMethod = require('*/cartridge/scripts/services/mollie/method/getMethod');
const getMethods = require('*/cartridge/scripts/services/mollie/method/getMethods');
const methodConstants = require('*/cartridge/scripts/services/mollie/method/methodConstants');

const createCustomer = require('*/cartridge/scripts/services/mollie/customer/createCustomer');
const customerConstants = require('*/cartridge/scripts/services/mollie/customer/customerConstants');

const requestPaymentSession = require('*/cartridge/scripts/services/mollie/applePay/requestPaymentSession');
const applePayConstants = require('*/cartridge/scripts/services/mollie/method/methodConstants');

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
    var mollie = new Mollie(methodConstants.GET_METHODS);
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
