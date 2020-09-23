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

    context('#processPaymentResult', () => {
        it('should process the payment result from Mollie with status COMPLETED', () => {
            var paymentResult = {
                status: STATUSMOCK.COMPLETED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.checkoutHelpersMock.placeOrder).have.to.been.calledOnce().and.to.have.been.called.with(this.order);
            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.setOrderShippingStatus).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status PAID', () => {
            var paymentResult = {
                status: STATUSMOCK.PAID
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.setOrderPaymentStatus).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status PENDING', () => {
            var paymentResult = {
                status: STATUSMOCK.PENDING
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.checkoutHelpersMock.placeOrder).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status ', () => {
            var paymentResult = {
                status: STATUSMOCK.AUTHORIZED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.checkoutHelpersMock.placeOrder).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status OPEN for Mollie order', () => {
            var paymentResult = {
                status: STATUSMOCK.OPEN,
                isCancelable: () => true
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');
            stubs.orderHelperMock.isMollieOrder.returns(true);

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.paymentServiceMock.cancelOrder).have.to.been.calledOnce();
            expect(stubs.paymentServiceMock.cancelPayment).not.to.have.to.been.called();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status OPEN for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.OPEN,
                isCancelable: () => true
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.paymentServiceMock.cancelOrder).not.have.to.been.called();
            expect(stubs.orderHelperMock.getPaymentId).to.have.been.called.calledOnce();
            expect(stubs.paymentServiceMock.cancelPayment).to.have.to.been.calledOnce();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status CREATED for Mollie payment', () => {
            var paymentResult = {
                status: STATUSMOCK.CREATED,
                isCancelable: () => false
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');
            stubs.orderHelperMock.isMollieOrder.returns(false);

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.paymentServiceMock.cancelOrder).not.have.to.been.called();
            expect(stubs.orderHelperMock.getPaymentId).not.have.to.been.called();
            expect(stubs.paymentServiceMock.cancelPayment).not.have.to.been.called();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status EXPIRED', () => {
            var paymentResult = {
                status: STATUSMOCK.EXPIRED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status CANCELED', () => {
            var paymentResult = {
                status: STATUSMOCK.CANCELED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.dw.TransactionMock.wrap).have.to.been.calledTwice();
            expect(stubs.orderHelperMock.failOrCancelOrder).have.to.been.calledOnce();
        });
        it('should process the payment result from Mollie with status FAILED', () => {
            var paymentResult = {
                status: STATUSMOCK.FAILED
            };

            stubs.configMock.getTransactionStatus.returns(STATUSMOCK);
            stubs.dw.URLUtilsMock.https.returns('Order-Confirm');

            paymentHelper.processPaymentResult(this.order, paymentResult);

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

            paymentHelper.processPaymentResult(this.order, paymentResult);

            expect(stubs.orderHelperMock.checkMollieRefundStatus).have.to.been.calledOnce();
        });
    });
});
