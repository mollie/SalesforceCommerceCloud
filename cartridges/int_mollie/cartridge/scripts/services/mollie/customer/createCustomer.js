var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    var payload = {
        name: params.profile.getFirstName() + ' ' + params.profile.getLastName(),
        email: params.profile.getEmail()
    };
    return payload;
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: CreateCustomemr: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            customer: new mollieResponseEntities.Customer(),
            raw: result || null
        };
    }
    return {
        customer: new mollieResponseEntities.Customer(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
