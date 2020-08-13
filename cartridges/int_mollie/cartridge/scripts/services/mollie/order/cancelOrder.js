var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');

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
    Logger.debug('MOLLIE :: CancelOrder: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            order: new mollieEntities.Order(),
            raw: result || null
        };
    }
    return {
        order: new mollieEntities.Order(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
