var CheckoutShippingServices = module.superModule;
var server = require('server');

server.extend(CheckoutShippingServices);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var BasketMgr = require('dw/order/BasketMgr');
var Locale = require('dw/util/Locale');

/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @name Mollie/CheckoutShippingServices-SubmitShipping
 * @function
 * @memberof CheckoutShippingServices
 * @param {returns} - json
 * @param {serverfunction} - append
 */
server.append('SubmitShipping', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (viewData.order && viewData.customer) {
            var countryCode = Locale.getLocale(req.locale.id).country;
            var currentBasket = BasketMgr.getCurrentBasket();

            viewData.order.billing.payment.applicablePaymentMethods = COHelpers.getMolliePaymentMethods(currentBasket, viewData.order, countryCode);
            viewData.paymentOptionsTemplate = COHelpers.getPaymentOptionsTemplate(BasketMgr.getCurrentBasket(),
                viewData.customer, viewData.order);
        }
        res.json(viewData);
    });

    return next();
});

module.exports = server.exports();
