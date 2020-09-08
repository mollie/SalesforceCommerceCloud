var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');

/**
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    return {
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
    Logger.debug('MOLLIE :: CancelOrderLineItem: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            order: new mollieResponseEntities.Order(),
            raw: result || null
        };
    }
    return {
        order: new mollieResponseEntities.Order(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
