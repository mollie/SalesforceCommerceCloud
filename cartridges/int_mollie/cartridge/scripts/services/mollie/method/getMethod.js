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
    Logger.debug('MOLLIE :: GetMethod: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            method: new mollieResponseEntities.Method(),
            raw: result || null
        };
    }
    return {
        method: new mollieResponseEntities.Method(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
