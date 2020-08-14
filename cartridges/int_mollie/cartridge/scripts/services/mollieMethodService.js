const getMethod = require('*/cartridge/scripts/services/mollie/method/getMethod');
const getMethods = require('*/cartridge/scripts/services/mollie/method/updateMethods');
const methodConstants = require('*/cartridge/scripts/services/mollie/method/methodConstants');
const Mollie = require('*/cartridge/scripts/services/mollie/Mollie');

exports.getMethod = function (parameters) {
    var mollie = new Mollie(methodConstants.GET_METHOD);
    mollie.addPayloadBuilder(getMethod.payloadBuilder);
    mollie.addResponseMapper(getMethod.responseMapper);
    return mollie.execute(parameters);
};

exports.getMethods = function (parameters) {
    var mollie = new Mollie(paymentConstants.GET_METHODS);
    mollie.addPayloadBuilder(getMethods.payloadBuilder);
    mollie.addResponseMapper(getMethods.responseMapper);
    return mollie.execute(parameters);
};
