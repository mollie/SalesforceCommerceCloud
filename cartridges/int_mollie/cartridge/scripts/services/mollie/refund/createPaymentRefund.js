var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');
var mollieRequestEntities = require('*/cartridge/scripts/services/mollie/mollieRequestEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    return {
        amount: params.amount,
    };
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: CreatePaymentRefund: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            refund: new mollieResponseEntities.Refund(),
            raw: result || null
        };
    }
    return {
        refund: new mollieResponseEntities.Refund(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
