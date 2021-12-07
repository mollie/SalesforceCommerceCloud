var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');

// Require and extend
var COHelpers = require('*/cartridge/scripts/utils/superModule')(module);

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @returns {Object} authorization result
 */
COHelpers.handlePayments = function (order) {
    try {
        if (order.totalNetPrice.getValue() === 0) throw new MollieServiceException('Order has netPrice of 0');

        var paymentInstruments = order.getPaymentInstruments();

        if (paymentInstruments.length === 0) throw new MollieServiceException('No paymentInstruments provided');

        // DO NOT DO ANYTHING WITH OTHER PAYMENT INSTRUMENTS AT THE MOMENT
        var mollieInstruments = orderHelper.getMolliePaymentInstruments(order);

        if (mollieInstruments.length !== 1) throw new MollieServiceException('Expected exactly 1 Mollie Payment Instrument');

        var paymentInstrument = mollieInstruments.pop();
        var paymentMethodID = paymentInstrument.getPaymentMethod();
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
        var hookName = 'app.payment.processor.' + paymentProcessor.getID().toLowerCase();

        if (!HookMgr.hasHook(hookName)) throw new MollieServiceException('Hook ' + hookName + ' not supported.');

        var authorizationResult = HookMgr.callHook(
            hookName,
            'Authorize',
            order,
            paymentInstrument,
            paymentProcessor
        );

        return authorizationResult;
    } catch (e) {
        var exception = e;
        Logger.debug('PAYMENT :: ERROR :: ' + exception.message);

        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        return {
            error: true,
            fieldErrors: [],
            serverErrors: [Resource.msg('error.technical', 'checkout', null)]
        };
    }
};

/**
 * Checks if order exists
 * @param {orderNumber} orderNumber - Order Id
 * @param {orderToken} orderToken - Order Token
 * @returns {boolean} Order exists?
 */
COHelpers.orderExists = function (orderNumber, orderToken) {
    return OrderMgr.getOrder(orderNumber, orderToken) !== null;
};

/**
 * Restores a basket based on the last created order that has not been paid.
 * @param {string} lastOrderNumber - orderId of last order in session
 * @param {string} lastOrderToken - orderToken of last order in session
 * @returns {void}
 */
COHelpers.restorePreviousBasket = function (lastOrderNumber, lastOrderToken) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket || currentBasket.getProductLineItems().length === 0) {
        if (lastOrderNumber && lastOrderToken) {
            var order = OrderMgr.getOrder(lastOrderNumber, lastOrderToken);
            if (order && order.getStatus().value === Order.ORDER_STATUS_CREATED
                && !orderHelper.getOrderIsAuthorized(order)) {
                Transaction.wrap(function () {
                    var message = 'PAYMENT :: Order failed because the basket cannot be restored for the customer otherwise.';
                    orderHelper.failOrder(order, message);
                });
            }
        }
    }
};

/**
 * Attempts to place order and fails order if attempt fails
 * @param {dw.order.Order} order - The order object to be placed
 * @returns {void}
 */
COHelpers.placeOrder = function placeOrder(order) {
    try {
        var orderStatus = order.getStatus().value;
        if (orderStatus === Order.ORDER_STATUS_CREATED || orderStatus === Order.ORDER_STATUS_FAILED) {
            if (orderStatus === Order.ORDER_STATUS_FAILED) {
                Transaction.begin();
                var undoFailOrderStatus = OrderMgr.undoFailOrder(order);
                if (undoFailOrderStatus.isError()) {
                    throw new Error(undoFailOrderStatus.message);
                }
                Transaction.commit();
            }

            Transaction.begin();
            var placeOrderStatus = OrderMgr.placeOrder(order);

            if (placeOrderStatus.isError()) {
                throw new Error(placeOrderStatus.message);
            }

            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            Transaction.commit();
        }
    } catch (e) {
        OrderMgr.failOrder(order, true);
        var errorMessage = 'PAYMENT :: Failed placing the order :: ' + JSON.stringify(e.message);
        orderHelper.addItemToOrderHistory(order, errorMessage, true);
        Transaction.commit();
        throw new MollieServiceException(errorMessage);
    }
};


/**
 * Get mollie viewdata
 * @param {dw.customer.Profile} profile - Customer Profile object
 * @returns {Object} Mollie viewData
 */
COHelpers.getMollieViewData = function (profile) {
    return {
        customerId: profile && profile.custom.mollieCustomerId,
        enableSingleClickPayments: config.getEnableSingleClickPayments(),
        enableQrCode: config.getEnableQrCode(),
        mollieComponents: {
            enabled: config.getComponentsEnabled(),
            profileId: config.getProfileId(),
            enableTestMode: config.getEnabledMode().value === 'TEST'
        }
    };
};

/**
 * Get mollie payment options template
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {Object} accountModel - The account model for the current customer
 * @param {Object} orderModel - The current customer's order history
 * @returns {Object} Rendered payment options template
 */
COHelpers.getPaymentOptionsTemplate = function (currentBasket, accountModel, orderModel) {
    return renderTemplateHelper.getRenderedHtml({
        customer: accountModel,
        order: orderModel,
        forms: {
            billingForm: COHelpers.prepareBillingForm(currentBasket)
        },
        mollie: COHelpers.getMollieViewData(currentBasket.customer.profile)
    }, 'checkout/billing/paymentOptions');
};

/**
 * Get mollie summary template
 * @param {Object} orderModel - The current customer's order history
 * @returns {Object} Rendered payment options template
 */
COHelpers.getPaymentSummaryTemplate = function (orderModel) {
    return renderTemplateHelper.getRenderedHtml({
        order: orderModel
    }, 'checkout/billing/paymentOptions/paymentOptionsSummary');
};

/**
 * Sets the Mollie payment methods based on the SFCC applicable payment methods
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {Object} orderModel - The current customer's order history
 * @param {string} countryCode - customer country code
 * @returns {Object} Mollie payment methods
 */
COHelpers.getMolliePaymentMethods = function (currentBasket, orderModel, countryCode) {
    var paymentMethods = orderModel.billing.payment.applicablePaymentMethods;
    var getMethodResponse = paymentService.getMethods(currentBasket, countryCode);
    var mollieMethods = {};

    getMethodResponse.methods.forEach(function (mollieMethod) {
        mollieMethods[mollieMethod.id] = mollieMethod;
    });

    return paymentMethods.filter(function (method) {
        return mollieMethods[method.molliePaymentMethodId] || !method.molliePaymentMethodId;
    }).map(function (method) {
        var mappedMethod = method;
        if (method.molliePaymentMethodId) {
            var mollieMethod = mollieMethods[method.molliePaymentMethodId];
            mappedMethod.issuers = mollieMethod && mollieMethod.issuers;

            if (mollieMethod.imageURL) {
                mappedMethod.image = mollieMethod.imageURL;
            }
        }
        return mappedMethod;
    });
};

module.exports = COHelpers;
