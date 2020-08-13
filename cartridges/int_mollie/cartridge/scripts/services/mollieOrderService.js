const createOrder = require('*/cartridge/scripts/services/mollie/order/createOrder');
const getOrder = require('*/cartridge/scripts/services/mollie/order/getOrder');
const updateOrder = require('*/cartridge/scripts/services/mollie/order/updateOrder');
const cancelOrder = require('*/cartridge/scripts/services/mollie/order/cancelOrder');
const orderConstants = require('*/cartridge/scripts/services/mollie/order/orderConstants');
const Mollie = require('*/cartridge/scripts/services/mollie/Mollie');

exports.createOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.CREATE_ORDER);
    saferpay.addPayloadBuilder(createOrder.payloadBuilder);
    saferpay.addResponseMapper(createOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.getOrder = function (parameters) {
    var mollie = new Mollie(paymentConstants.GET_ORDER);
    saferpay.addPayloadBuilder(getOrder.payloadBuilder);
    saferpay.addResponseMapper(getOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.updateOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.UPDATE_ORDER);
    saferpay.addPayloadBuilder(updateOrder.payloadBuilder);
    saferpay.addResponseMapper(updateOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.CANCEL_ORDER);
    saferpay.addPayloadBuilder(cancelOrder.payloadBuilder);
    saferpay.addResponseMapper(cancelOrder.responseMapper);
    return mollie.execute(parameters);
};
