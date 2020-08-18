const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const orderHelper = proxyquire(`${base}/int_mollie/cartridge/scripts/order/orderHelper`, {
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    'dw/order/Order': stubs.dw.OrderMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock
});

describe('order/orderHelper', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#addItemToOrderHistory', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.historyItem = faker.lorem.paragraph();
        });

        it('tracks an order change', () => {
            expect(orderHelper.addItemToOrderHistory(this.order, this.historyItem)).to.be.undefined();
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.historyItem);
            expect(stubs.loggerMock.debug).not.to.have.been.called();
        });

        it('allows for logging historyItem to debug stream', () => {
            expect(orderHelper.addItemToOrderHistory(this.order, this.historyItem, true)).to.be.undefined();
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.historyItem);
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.historyItem);
        });
    });

    context('#failOrder', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.errorMessage = faker.lorem.paragraph();
        });

        it('fails an order and logs orderHistory', () => {
            expect(orderHelper.failOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, true);
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
        });

        it('logs to orderHistory when failing an order fails', () => {
            stubs.dw.statusMock.isError.returns(true);
            stubs.dw.statusMock.getMessage.returns('BOOM');
            expect(orderHelper.failOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(this.order.trackOrderChange).to.have.been.calledTwice()
                .and.to.have.been.calledWith(sinon.match('BOOM'));
            expect(stubs.loggerMock.debug).to.have.been.calledTwice();
        });
    });

    context('#cancelOrder', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.errorMessage = faker.lorem.paragraph();
        });

        it('fails an order and logs orderHistory', () => {
            expect(orderHelper.cancelOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(stubs.dw.OrderMgrMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order);
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
        });

        it('logs to orderHistory when failing an order fails', () => {
            stubs.dw.statusMock.isError.returns(true);
            stubs.dw.statusMock.getMessage.returns('BOOM');
            expect(orderHelper.cancelOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(this.order.trackOrderChange).to.have.been.calledTwice()
                .and.to.have.been.calledWith(sinon.match('BOOM'));
            expect(stubs.loggerMock.debug).to.have.been.calledTwice();
        });
    });

    context('#failOrCancelOrder', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.errorMessage = faker.lorem.paragraph();
        });

        it('fails an order and logs orderHistory', () => {
            this.order.getStatus.returns(stubs.dw.OrderMock.ORDER_STATUS_CREATED);
            expect(orderHelper.failOrCancelOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, true);
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
        });

        it('cancels an order and logs orderHistory', () => {
            this.order.getStatus.returns(stubs.dw.OrderMock.ORDER_STATUS_NEW);
            expect(orderHelper.failOrCancelOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(stubs.dw.OrderMgrMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order);
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
        });


        it('logs to orderHistory an order does not have the correct status', () => {
            this.order.getStatus.returns(stubs.dw.OrderMock.ORDER_STATUS_CREATED);
            expect(orderHelper.failOrCancelOrder(this.order, this.errorMessage)).to.be.undefined();
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(this.errorMessage);
            expect(stubs.loggerMock.debug).to.have.been.calledOnce();
        });
    });

    context('#setPaymentStatus', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.paidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_PAID;
            this.unpaidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_UNPAID;
        });

        it('sets an order paymentStatus when current status is differen from desired one', () => {
            this.order.getPaymentStatus.returns({
                getValue: () => this.unpaidStatus
            });

            expect(orderHelper.setPaymentStatus(this.order, this.paidStatus)).to.be.undefined();

            expect(this.order.setPaymentStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.paidStatus);
            expect(this.order.trackOrderChange).to.have.been.calledOnce();
        });

        it('does not an order paymentStatus when current status is same as desired one', () => {
            this.order.getPaymentStatus.returns({
                getValue: () => this.paidStatus
            });

            expect(orderHelper.setPaymentStatus(this.order, this.paidStatus)).to.be.undefined();

            expect(this.order.setPaymentStatus).not.to.have.been.called();
            expect(this.order.trackOrderChange).not.to.have.been.called();
        });
    });

    context('#getMolliePaymentInstruments', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.paidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_PAID;
            this.unpaidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_UNPAID;

            this.paymentProcessor = new stubs.dw.PaymentProcessorMock();
            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentMethod.returns('paymentMethodID');

            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.getPaymentProcessor.returns(this.paymentProcessor);

            this.order.getPaymentInstruments.returns({ toArray: () => [this.paymentInstrument] });

            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);
        });

        it('fetches all Mollie PaymentInstruments', () => {
            this.paymentProcessor.getID.returns('MOLLIE_PROCESSOR');
            this.order.getPaymentStatus.returns({
                getValue: () => this.unpaidStatus
            });

            expect(orderHelper.getMolliePaymentInstruments(this.order)).to.eql([this.paymentInstrument]);
        });
        it('fetches all Mollie PaymentInstruments with a specific paymentMethod', () => {
            this.paymentProcessor.getID.returns('MOLLIE_PROCESSOR');
            this.order.getPaymentStatus.returns({
                getValue: () => this.unpaidStatus
            });

            expect(orderHelper.getMolliePaymentInstruments(this.order, 'paymentMethodID')).to.eql([this.paymentInstrument]);
        });
        it('returns empty when no Mollie Instruments are available', () => {
            this.paymentProcessor.getID.returns('OTHER_PROCESSOR');
            this.order.getPaymentStatus.returns({
                getValue: () => this.unpaidStatus
            });

            expect(orderHelper.getMolliePaymentInstruments(this.order, 'paymentMethodID')).to.eql([]);
        });
        it('returns empty when no Mollie Instruments of specified method are available', () => {
            this.order.getPaymentInstruments.returns({ toArray: () => [] });
            this.paymentProcessor.getID.returns('MOLLIE_PROCESSOR');
            this.order.getPaymentStatus.returns({
                getValue: () => this.unpaidStatus
            });

            expect(orderHelper.getMolliePaymentInstruments(this.order, 'otherPaymentMethodID')).to.eql([]);
            expect(this.order.getPaymentInstruments).to.have.been.calledWith('otherPaymentMethodID');
        });
    });

    context('#setCustomPropertyOnTransaction', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.paidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_PAID;
            this.unpaidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_UNPAID;

            this.paymentProcessor = new stubs.dw.PaymentProcessorMock();
            this.paymentProcessor.getID.returns('MOLLIE_PROCESSOR');
            this.paymentTransaction = new stubs.dw.PaymentTransactionMock();
            this.paymentTransaction.custom = {};
            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentMethod.returns('paymentMethodID');
            this.paymentInstrument.getPaymentTransaction.returns(this.paymentTransaction);

            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.getPaymentProcessor.returns(this.paymentProcessor);

            this.order.getPaymentInstruments.returns({ toArray: () => [this.paymentInstrument] });

            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);
        });
        it('setTransactionStatus', () => {
            orderHelper.setTransactionStatus(this.order, 'paymentMethodID', 'transactionStatus');
            expect(this.paymentTransaction.custom.mollieTransactionStatus).to.eql('transactionStatus');
        });
        it('setTransactionPaymentId', () => {
            orderHelper.setTransactionPaymentId(this.order, 'paymentMethodID', 'paymentId');
            expect(this.paymentTransaction.custom.mollieTransactionPaymentId).to.eql('paymentId');
        });
        it('setTransactionOrderId', () => {
            orderHelper.setTransactionOrderId(this.order, 'paymentMethodID', 'orderId');
            expect(this.paymentTransaction.custom.mollieTransactionOrderId).to.eql('orderId');
        });
        it('setTransactionAPI', () => {
            orderHelper.setTransactionAPI(this.order, 'paymentMethodID', 'transactionAPI');
            expect(this.paymentTransaction.custom.mollieTransactionAPI).to.eql('transactionAPI');
        });
        it('does nothing when no paymentInstrument is found', () => {
            this.order.getPaymentInstruments.returns({ toArray: () => [] });
            orderHelper.setTransactionStatus(this.order, 'paymentMethodID', 'transactionStatus');
            expect(this.paymentTransaction.custom.mollieTransactionId).to.be.undefined();
        });
    });

    context('#getCustomPropertyOnTransaction', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.paidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_PAID;
            this.unpaidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_UNPAID;

            this.paymentProcessor = new stubs.dw.PaymentProcessorMock();
            this.paymentProcessor.getID.returns('MOLLIE_PROCESSOR');
            this.paymentTransaction = new stubs.dw.PaymentTransactionMock();
            this.paymentTransaction.custom = {
                mollieTransactionStatus: 'transactionStatus',
                mollieTransactionPaymentId: 'paymentId',
                mollieTransactionOrderId: 'orderId',
                mollieTransactionAPI: 'transactionAPI',
            };
            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentMethod.returns('paymentMethodID');
            this.paymentInstrument.getPaymentTransaction.returns(this.paymentTransaction);

            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.getPaymentProcessor.returns(this.paymentProcessor);

            this.order.getPaymentInstruments.returns({ toArray: () => [this.paymentInstrument] });

            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);
        });
        it('getTransactionStatus', () => {
            expect(orderHelper.getTransactionStatus(this.order, 'paymentMethodID')).to.eql('transactionStatus');
        });
        it('getTransactionPaymentId', () => {
            expect(orderHelper.getTransactionPaymentId(this.order, 'paymentMethodID')).to.eql('paymentId');
        });
        it('getTransactionOrderId', () => {
            expect(orderHelper.getTransactionOrderId(this.order, 'paymentMethodID')).to.eql('orderId');
        });
        it('getTransactionAPI', () => {
            expect(orderHelper.getTransactionAPI(this.order, 'paymentMethodID')).to.eql('transactionAPI');
        });
        it('returns null if no paymentInstrument is found', () => {
            this.order.getPaymentInstruments.returns({ toArray: () => [] });
            expect(orderHelper.getTransactionStatus(this.order, 'paymentMethodID')).to.be.null();
        });
    });
});
