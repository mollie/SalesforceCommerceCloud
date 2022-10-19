const { expect } = require('chai');

const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const paymentHelper = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/paymentHelper`, {
    'dw/system/Transaction': stubs.dw.TransactionMock,
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/web/URLUtils': stubs.dw.URLUtilsMock,
    'dw/web/Resource': stubs.dw.ResourceMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/checkout/checkoutHelpers': stubs.checkoutHelpersMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock
});

var STATUSMOCK = {
    OPEN: 'open',
    CREATED: 'created',
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    PAID: 'paid',
    SHIPPING: 'shipping',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELED: 'canceled',
    FAILED: 'failed'
};

describe('payment/paymentHelper', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });
    beforeEach(() => {
        this.order = new stubs.dw.OrderMock();
        this.orderId = faker.random.uuid();
        global.session = {
            privacy: {}
        };
    });

    context('#processPaymentResultHook', () => {
        it('should process the payment result hook from Mollie with status COMPLETED', () => {
            var paymentResult = {
                status: STATUSMOCK.COMPLETED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.checkoutHelpersMock.placeOrder).have.to.been.calledOnce().and.to.have.been.called.with(this.order);
            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.setOrderShippingStatus).have.to.been.calledOnce();
        });
        it('should process the payment result hook from Mollie with status PAID', () => {
            var paymentResult = {
                status: STATUSMOCK.PAID
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.setOrderPaymentStatus).have.to.been.calledOnce();
        });
        it('should process the payment result hook from Mollie with status AUTHORIZED', () => {
            var paymentResult = {
                status: STATUSMOCK.AUTHORIZED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.orderHelperMock.setOrderIsAuthorized).have.to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, true);
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
        });
        it('should process the payment result hook from Mollie with status EXPIRED', () => {
            var paymentResult = {
                status: STATUSMOCK.EXPIRED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result hook from Mollie with status CANCELED', () => {
            var paymentResult = {
                status: STATUSMOCK.CANCELED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result hook from Mollie with status FAILED', () => {
            var paymentResult = {
                status: STATUSMOCK.FAILED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should call checkMollieRefundStatus', () => {
            var paymentResult = {
                status: STATUSMOCK.CREATED,
                isCancelable: () => true
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultHook(this.order, paymentResult);

            expect(stubs.orderHelperMock.checkMollieRefundStatus).have.to.been.calledOnce();
        });
    });

    context('#processPaymentResultRedirect', () => {
        it('should process the payment result redirect from Mollie with status PENDING', () => {
            var paymentResult = {
                status: STATUSMOCK.PENDING
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
        });
        it('should process the payment result redirect from Mollie with status CREATED for Mollie order', () => {
            var paymentResult = {
                status: STATUSMOCK.CREATED,
                isCancelable: () => true
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');
            stubs.orderHelperMock.isMollieOrder.returns(true);

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
        });
        it('should process the payment result redirect from Mollie with status OPEN for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.OPEN,
                isCancelable: () => true
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
        });
        it('should process the payment result redirect from Mollie with status SHIPPING for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.SHIPPING
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
        });
        it('should process the payment result redirect from Mollie with status EXPIRED for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.EXPIRED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Checkout-Begin');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.not.been.called();
        });
        it('should process the payment result redirect from Mollie with status CANCELED for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.CANCELED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Checkout-Begin');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.not.been.called();
        });
        it('should process the payment result redirect from Mollie with status FAILED for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.FAILED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Checkout-Begin');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResultRedirect(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.not.been.called();
        });
    });

    context('#processQR', () => {
        it('should return the correct result for orders with mollieStatus OPEN', () => {
            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.orderHelperMock.getPaymentStatus.returns(STATUSMOCK.OPEN);
            stubs.dw.URLUtilsMock.https.returns('MolliePayment-Redirect');

            var result = paymentHelper.processQR(this.order);

            expect(result.paidStatus).to.be.true();
            expect(result.continueUrl).to.match(/^MolliePayment-Redirect/);
        });
        it('should return the correct result for orders with mollieStatus PAID', () => {
            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.orderHelperMock.getPaymentStatus.returns(STATUSMOCK.PAID);
            stubs.dw.URLUtilsMock.https.returns('MolliePayment-Redirect');

            var result = paymentHelper.processQR(this.order);

            expect(result.paidStatus).to.be.true();
            expect(result.continueUrl).to.match(/^MolliePayment-Redirect/);
        });
        it('should return the correct result for orders with mollieStatus EXPIRED', () => {
            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.orderHelperMock.getPaymentStatus.returns(STATUSMOCK.EXPIRED);
            stubs.dw.URLUtilsMock.https.returns('Checkout-Begin');

            var result = paymentHelper.processQR(this.order);

            expect(result.paidStatus).to.be.false();
            expect(result.continueUrl).to.match(/^Checkout-Begin/);
        });
        it('should return the correct result for orders with mollieStatus CANCELED', () => {
            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.orderHelperMock.getPaymentStatus.returns(STATUSMOCK.CANCELED);
            stubs.dw.URLUtilsMock.https.returns('Checkout-Begin');

            var result = paymentHelper.processQR(this.order);

            expect(result.paidStatus).to.be.false();
            expect(result.continueUrl).to.match(/^Checkout-Begin/);
        });
        it('should return the correct result for orders with mollieStatus FAILED', () => {
            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.orderHelperMock.getPaymentStatus.returns(STATUSMOCK.FAILED);
            stubs.dw.URLUtilsMock.https.returns('Checkout-Begin');

            var result = paymentHelper.processQR(this.order);

            expect(result.paidStatus).to.be.false();
            expect(result.continueUrl).to.match(/^Checkout-Begin/);
        });
        it('should return the correct result for orders with mollieStatus PENDING', () => {
            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.orderHelperMock.getPaymentStatus.returns(STATUSMOCK.PENDING);

            var result = paymentHelper.processQR(this.order);

            expect(result.paidStatus).to.be.false();
            expect(result.continueUrl).to.be.undefined();
        });
    });
});
