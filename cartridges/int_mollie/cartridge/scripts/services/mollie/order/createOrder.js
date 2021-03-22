var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');
var mollieRequestEntities = require('*/cartridge/scripts/services/mollie/mollieRequestEntities');
var date = require('*/cartridge/scripts/utils/date');
var config = require('*/cartridge/scripts/mollieConfig');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    var paymentMethodExpiryDays = params.paymentMethod.custom.mollieOrderExpiryDays.value;
    var expiryDays = paymentMethodExpiryDays === config.getDefaultAttributeValue() ? config.getDefaultOrderExpiryDays().value : Number(paymentMethodExpiryDays);
    var payload = {
        amount: new mollieRequestEntities.Currency(params.totalGrossPrice),
        orderNumber: params.orderId,
        locale: request.getLocale(),
        redirectUrl: URLUtils.https('MolliePayment-Redirect', 'orderId', params.orderId).toString(),
        webhookUrl: URLUtils.https('MolliePayment-Hook', 'orderId', params.orderId).toString(),
        method: params.paymentMethod.custom.molliePaymentMethodId,
        lines: new mollieRequestEntities.Lines(params.productLineItems, params.shipments, params.priceAdjustments),
        billingAddress: new mollieRequestEntities.Address(params.billingAddress, params.email),
        payment: {},
        expiresAt: date.format(date.addDays(date.now(), expiryDays), 'yyyy-MM-dd')
    };

    if (params.cardToken) {
        payload.payment.cardToken = params.cardToken;
    }
    if (params.issuer) {
        payload.payment.issuer = params.issuer;
    }
    if (params.customerId) {
        payload.payment.customerId = params.customerId;
    }

    Logger.debug(this.serviceName + ' :: Service: ' + JSON.stringify(payload));

    return payload;
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: CreateOrder: ' + JSON.stringify(result));
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
