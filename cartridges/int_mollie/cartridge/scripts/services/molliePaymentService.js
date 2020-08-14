const createPayment = require('*/cartridge/scripts/services/mollie/payment/createPayment');
const getPayment = require('*/cartridge/scripts/services/mollie/payment/getPayment');
const updatePayment = require('*/cartridge/scripts/services/mollie/payment/updatePayment');
const cancelPayment = require('*/cartridge/scripts/services/mollie/payment/cancelPayment');
const paymentConstants = require('*/cartridge/scripts/services/mollie/payment/paymentConstants');
const Mollie = require('*/cartridge/scripts/services/mollie/Mollie');

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

exports.updatePayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.UPDATE_PAYMENT);
    mollie.addPayloadBuilder(updatePayment.payloadBuilder);
    mollie.addResponseMapper(updatePayment.responseMapper);
    return mollie.execute(parameters);
};

exports.cancelPayment = function (parameters) {
    var mollie = new Mollie(paymentConstants.CANCEL_PAYMENT);
    mollie.addPayloadBuilder(cancelPayment.payloadBuilder);
    mollie.addResponseMapper(cancelPayment.responseMapper);
    return mollie.execute(parameters);
};
