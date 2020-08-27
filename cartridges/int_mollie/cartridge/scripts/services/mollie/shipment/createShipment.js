var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');

/**
 *
 *
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
    Logger.debug('MOLLIE :: CreateShipment: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            shipment: new mollieEntities.Shipment(),
            raw: result || null
        };
    }
    return {
        shipment: new mollieEntities.Shipment(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
