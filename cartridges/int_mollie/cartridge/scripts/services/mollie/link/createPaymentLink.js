var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');
var mollieRequestEntities = require('*/cartridge/scripts/services/mollie/mollieRequestEntities');

/**
 * 
 * @param {Object} params - parameters
 * @param {string} endpoint - endpoint
 * @param {boolean} redirectFromPaymentLink - Provide extra boolean to identiy the later redirect call
 * @returns 
 */
function constructUrlFromSiteContext(params, endpoint, redirectFromPaymentLink) {
    var constructedUrl;
    if (params.usedSiteContext) {
        constructedUrl = params.usedSiteContext.replace('Replace-Me', endpoint);
        constructedUrl += '?orderId='+ params.orderId + '&orderToken=' + params.orderToken;
        if (redirectFromPaymentLink) {
            constructedUrl += '&link=true';
        }
    }
    return constructedUrl;
}

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    var payload = {
        amount: new mollieRequestEntities.Currency(params.totalGrossPrice),
        description: params.description,
        redirectUrl: constructUrlFromSiteContext(params, 'MolliePayment-Redirect', true),
        webhookUrl: constructUrlFromSiteContext(params, 'MolliePayment-Hook'),
        reusable: false,
        expiresAt: null
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
    Logger.debug('MOLLIE :: CreatePaymentLink: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            payment: new mollieResponseEntities.PaymentLink(),
            raw: result || null
        };
    }
    return {
        payment: new mollieResponseEntities.PaymentLink(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
