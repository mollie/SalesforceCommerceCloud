var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    return {
        amount: params.amount,
        lines: params.lines
    };
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: CreateOrderRefund: ' + JSON.stringify(result));
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
