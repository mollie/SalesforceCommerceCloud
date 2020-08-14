var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');

/**
 * TODO
 * @returns {Object} payload - returns payload
 */
function payloadBuilder() {
    return {};
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: UpdatePayment: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            payment: new mollieEntities.Payment(),
            raw: result || null
        };
    }
    return {
        payment: new mollieEntities.Payment(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
