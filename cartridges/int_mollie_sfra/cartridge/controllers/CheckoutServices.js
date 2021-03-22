var CheckoutServices = module.superModule;
var server = require('server');

server.extend(CheckoutServices);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

server.append('SubmitPayment', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (viewData.order) {
            viewData.order.paymentSummaryTemplate = COHelpers.getPaymentSummaryTemplate(viewData.order);
        }
        res.json(viewData);
    });

    next();
});

module.exports = server.exports();
