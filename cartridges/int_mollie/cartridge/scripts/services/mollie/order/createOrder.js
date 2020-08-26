var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    var payload = {
        amount: new sfccEntities.Currency(params.totalGrossPrice),
        orderNumber: params.orderId,
        locale: request.getLocale(),
        redirectUrl: URLUtils.https('MolliePayment-Redirect', 'orderId', params.orderId).toString(),
        webhookUrl: URLUtils.https('MolliePayment-Hook', 'orderId', params.orderId).toString(),
        method: params.methodId,
        lines: params.productLineItems.toArray().map(function (productLineItem) {
            return new sfccEntities.ProductLineItem(productLineItem);
        }),
        billingAddress: new sfccEntities.Address(params.billingAddress, params.profile),
        payment: {}
    };

    params.shipments.toArray().forEach(function (shipment) {
        shipment.getShippingLineItems().toArray().forEach(function (shippingLineItem) {
            payload.lines.push(new sfccEntities.ShippingLineItem(shippingLineItem));
        });
    });

    if (params.cardToken) {
        payload.payment.cardToken = params.cardToken;
    }
    Logger.error(this.serviceName + ' :: Service: ' + JSON.stringify(payload));

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
