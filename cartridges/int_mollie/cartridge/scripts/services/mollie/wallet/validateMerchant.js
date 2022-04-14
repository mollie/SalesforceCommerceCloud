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
        validationUrl: params.validationUrl,
        domain: params.domain
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
    Logger.debug('MOLLIE :: ValidateMerchant: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            session: new mollieResponseEntities.Session(),
            raw: result || null
        };
    }
    return {
        payment: new mollieResponseEntities.Session(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
