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
        validationUrl: params.validationURL,
        domain: 'https://zziu-003.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch'
    };
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: RequestPaymentSession: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            applePayResponse: new mollieResponseEntities.ApplePayResponse(),
            raw: result || null
        };
    }
    return {
        applePayResponse: new mollieResponseEntities.ApplePayResponse(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
