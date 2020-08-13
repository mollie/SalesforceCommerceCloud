var Logger = require('*/cartridge/scripts/utils/logger');
var entities = require('*/cartridge/scripts/services/mollie/mollieEntities');

/**
 *
 * @returns {Object} payload - returns payload
 */
function payloadBuilder() {
    return {};
}

/**
 *
 *
 * @param {Object} result - Saferpay Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: GetPayment: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            payment: new entities.Payment(),
            raw: result || null
        };
    }
    return {
        payment: new entities.Payment(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
