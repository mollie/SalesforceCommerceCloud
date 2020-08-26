/**
* Job Step Type that fails orders that have not been paid after 24 hours
*/

'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');

/**
 * Returns true if the given {params} object contains a isDisabled property as true.
 * This will allows us to disable a step without removing it from the configuration
 *
 * @param {Object} params - arguments
 *
 * @return {boolean} - isDisabled
 */
var isDisabled = function (params) {
    return ['true', true].indexOf(params.IsDisabled) > -1;
};

/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
 */
var run = function () {
    var paymentService = require('*/cartridge/scripts/payment/paymentService');
    var orderHelper = require('*/cartridge/scripts/order/orderHelper');
    var checkoutServicesService = require('*/cartridge/scripts/checkout/checkoutServicesService');
    var Logger = require('*/cartridge/scripts/utils/logger');
    var dateUtil = require('*/cartridge/scripts/utils/date');
    var SaferpayTransactionService = require('*/cartridge/scripts/services/saferpayTransactionService');

    var args = arguments[0];

    if (empty(args)) {
        return new Status(Status.ERROR, 'ERROR', 'Job requires parameters');
    }

    if (isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    try {
        // Load input Parameters
        var expireAfterHours = args.ExpireAfterHours;
        var createdBefore = dateUtil.addHours(dateUtil.now(), -expireAfterHours);
        var cancelTransactionResult;

        OrderMgr.processOrders(function (order) {
            Transaction.wrap(function () {
                var saferpayTransaction = paymentService.getPaymentTransaction(order);
                if (!saferpayTransaction) {
                    orderHelper.failOrder(order, 'PAYMENT :: ERROR :: order expired');
                } else if (saferpayTransaction.isAuthorised()) {
                    cancelTransactionResult = SaferpayTransactionService.cancelTransaction({ transactionId: saferpayTransaction.id });
                    orderHelper.addItemToOrderHistory(order, 'SAFERPAY :: CancelTransactionResult: ' + cancelTransactionResult.raw);
                    orderHelper.failOrder(order, 'PAYMENT :: ERROR :: order expired');
                } else if (saferpayTransaction.isCaptured()) {
                    orderHelper.setPaymentStatus(order, Order.PAYMENT_STATUS_PAID);
                    checkoutServicesService.placeOrder(order);
                    checkoutServicesService.sendConfirmationEmail(order, 'en_US');
                } else {
                    cancelTransactionResult = SaferpayTransactionService.cancelTransaction({ transactionId: saferpayTransaction.id });
                    orderHelper.addItemToOrderHistory(order, 'SAFERPAY :: CancelTransactionResult: ' + cancelTransactionResult.raw);
                    orderHelper.failOrder(order, 'PAYMENT :: ERROR :: order expired');
                }
            });
        }, 'status = {0} AND creationDate < {1}', Order.ORDER_STATUS_CREATED, createdBefore.getTime());

        return new Status(Status.OK);
    } catch (e) {
        Logger.error('SAFERPAY :: JOBS :: ERROR :: ' + e.message);
        return new Status(Status.ERROR);
    }
};

exports.Run = run;
