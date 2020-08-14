const createOrder = require('*/cartridge/scripts/services/mollie/order/createOrder');
const getOrder = require('*/cartridge/scripts/services/mollie/order/getOrder');
const updateOrder = require('*/cartridge/scripts/services/mollie/order/updateOrder');
const cancelOrder = require('*/cartridge/scripts/services/mollie/order/cancelOrder');
const orderConstants = require('*/cartridge/scripts/services/mollie/order/orderConstants');
const Mollie = require('*/cartridge/scripts/services/mollie/Mollie');

exports.createOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.CREATE_ORDER);
    mollie.addPayloadBuilder(createOrder.payloadBuilder);
    mollie.addResponseMapper(createOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.getOrder = function (parameters) {
    var mollie = new Mollie(paymentConstants.GET_ORDER);
    mollie.addPayloadBuilder(getOrder.payloadBuilder);
    mollie.addResponseMapper(getOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.updateOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.UPDATE_ORDER);
    mollie.addPayloadBuilder(updateOrder.payloadBuilder);
    mollie.addResponseMapper(updateOrder.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelOrder = function (parameters) {
    var mollie = new Mollie(orderConstants.CANCEL_ORDER);
    mollie.addPayloadBuilder(cancelOrder.payloadBuilder);
    mollie.addResponseMapper(cancelOrder.responseMapper);
    return mollie.execute(parameters);
};
