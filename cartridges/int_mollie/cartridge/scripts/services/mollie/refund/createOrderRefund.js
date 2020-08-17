var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    return {
        orderId: params.orderId,
        amount: new sfccEntities.Currency(params.amount),
        lines: []
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
            refund: new mollieEntities.Refund(),
            raw: result || null
        };
    }
    return {
        refund: new mollieEntities.Refund(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
