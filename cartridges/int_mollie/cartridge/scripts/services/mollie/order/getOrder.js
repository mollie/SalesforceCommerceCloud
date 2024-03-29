var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');

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
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: GetOrder: ' + JSON.stringify(result));
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
