const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const orderHelper = proxyquire(`${base}/int_mollie/cartridge/scripts/order/orderHelper`, {
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock
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
            this.order.getStatus.returns({
                value: stubs.dw.OrderMock.ORDER_STATUS_CREATED
            });
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

    context('#setOrderPaymentStatus', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.paidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_PAID;
            this.unpaidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_UNPAID;
        });

        it('sets an order paymentStatus when current status is differen from desired one', () => {
            this.order.getPaymentStatus.returns({
                getValue: () => this.unpaidStatus
            });

            expect(orderHelper.setOrderPaymentStatus(this.order, this.paidStatus)).to.be.undefined();

            expect(this.order.setPaymentStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.paidStatus);
            expect(this.order.trackOrderChange).to.have.been.calledOnce();
        });

        it('does not an order paymentStatus when current status is same as desired one', () => {
            this.order.getPaymentStatus.returns({
                getValue: () => this.paidStatus
            });

            expect(orderHelper.setOrderPaymentStatus(this.order, this.paidStatus)).to.be.undefined();

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
        it('setPaymentId', () => {
            orderHelper.setPaymentId(this.order, 'paymentMethodID', 'paymentId');
            expect(this.paymentTransaction.custom.molliePaymentId).to.eql('paymentId');
        });
        it('setPaymentStatus', () => {
            orderHelper.setPaymentStatus(this.order, 'paymentMethodID', 'paymentStatus');
            expect(this.paymentTransaction.custom.molliePaymentStatus).to.eql('paymentStatus');
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
                molliePaymentStatus: 'paymentStatus',
                molliePaymentId: 'paymentId'
            };
            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentMethod.returns('paymentMethodID');
            this.paymentInstrument.getPaymentTransaction.returns(this.paymentTransaction);

            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.getPaymentProcessor.returns(this.paymentProcessor);

            this.order.getPaymentInstruments.returns({ toArray: () => [this.paymentInstrument] });

            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);
        });
        it('getPaymentId', () => {
            expect(orderHelper.getPaymentId(this.order, 'paymentMethodID')).to.eql('paymentId');
        });
        it('getPaymentStatus', () => {
            expect(orderHelper.getPaymentStatus(this.order, 'paymentMethodID')).to.eql('paymentStatus');
        });
        it('returns null if no paymentInstrument is found', () => {
            this.order.getPaymentInstruments.returns({ toArray: () => [] });
            expect(orderHelper.getPaymentId(this.order, 'paymentMethodID')).to.be.null();
        });
    });

    context('#setCustomPropertyOnOrder', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
        });
        it('setOrderId', () => {
            orderHelper.setOrderId(this.order, 'orderId');
            expect(this.order.custom.mollieOrderId).to.eql('orderId');
        });
        it('setOrderStatus', () => {
            orderHelper.setOrderStatus(this.order, 'orderStatus');
            expect(this.order.custom.mollieOrderStatus).to.eql('orderStatus');
        });
        it('setUsedTransactionAPI', () => {
            orderHelper.setUsedTransactionAPI(this.order, 'transactionAPI');
            expect(this.order.custom.mollieUsedTransactionAPI).to.eql('transactionAPI');
        });
    });

    context('#getCustomPropertyOnOrder', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.order.custom = {
                mollieOrderId: 'orderId',
                mollieOrderStatus: 'orderStatus',
                mollieUsedTransactionAPI: 'usedTransactionAPI'
            };
        });
        it('getOrderId', () => {
            expect(orderHelper.getOrderId(this.order)).to.eql('orderId');
        });
        it('getOrderStatus', () => {
            expect(orderHelper.getOrderStatus(this.order)).to.eql('orderStatus');
        });
        it('getUsedTransactionAPI', () => {
            expect(orderHelper.getUsedTransactionAPI(this.order)).to.eql('usedTransactionAPI');
        });
    });
});
