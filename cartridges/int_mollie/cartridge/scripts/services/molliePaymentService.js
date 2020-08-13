const createPayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
const getPayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
const updatePayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
const cancelPayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
const paymentConstants = require('*/cartridge/scripts/services/mollie/payment/paymentConstants');
const Mollie = require('*/cartridge/scripts/services/mollie/Mollie');

exports.createPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.CREATE_PAYMENT);
    saferpay.addPayloadBuilder(createPayment.payloadBuilder);
    saferpay.addResponseMapper(createPayment.responseMapper);
    return mollie.execute(parameters);
};

exports.getPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.GET_PAYMENT);
    saferpay.addPayloadBuilder(getPayment.payloadBuilder);
    saferpay.addResponseMapper(getPayment.responseMapper);
    return mollie.execute(parameters);
};

exports.updatePayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.UPDATE_PAYMENT);
    saferpay.addPayloadBuilder(updatePayment.payloadBuilder);
    saferpay.addResponseMapper(updatePayment.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.CANCEL_PAYMENT);
    saferpay.addPayloadBuilder(cancelPayment.payloadBuilder);
    saferpay.addResponseMapper(cancelPayment.responseMapper);
    return mollie.execute(parameters);
};
