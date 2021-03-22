const { expect } = require('chai');

const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const orderHelper = proxyquire(`${base}/int_mollie/cartridge/scripts/order/orderHelper`, {
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock
});

const REFUND_STATUS = {
    NOTREFUNDED: 'REFUND_STATUS_NOTREFUNDED',
    PARTREFUNDED: 'REFUND_STATUS_PARTREFUNDED',
    REFUNDED: 'REFUND_STATUS_REFUNDED'
};

describe('order/orderHelper', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#getMappedPaymentDescription', () => {
        beforeEach(() => {
            this.siteName = faker.lorem.word();
            stubs.configMock.getSiteName.returns(this.siteName);
            this.order = new stubs.dw.OrderMock();
            this.order = Object.assign(this.order, {
                orderNo: faker.random.uuid(),
                customerOrderReference: faker.lorem.word(),
                billingAddress: {
                    firstName: faker.lorem.word(),
                    lastName: faker.lorem.word(),
                    companyName: faker.lorem.word()
                }
            });
            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.description = {
                markup: '{orderNumber}, {storeName}, {order.reference}, {customer.firstName}, {customer.lastName}, {customer.company}'
            };
        });

        it('Creates payment description for order', () => {
            var description = orderHelper.getMappedPaymentDescription(this.order, this.paymentMethod);
            var markup = `${this.order.orderNo}, ${this.siteName}, ${this.order.customerOrderReference}, ${this.order.billingAddress.firstName}, ${this.order.billingAddress.lastName}, ${this.order.billingAddress.companyName}`;

            expect(description).to.eql(markup);
        });
    });

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
            orderHelper.failOrder(this.order, this.errorMessage);
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
            orderHelper.failOrder(this.order, this.errorMessage);
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
            orderHelper.cancelOrder(this.order, this.errorMessage);
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
            orderHelper.cancelOrder(this.order, this.errorMessage);
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
            orderHelper.failOrCancelOrder(this.order, this.errorMessage);
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, true);
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
        });

        it('cancels an order and logs orderHistory', () => {
            this.order.getStatus.returns({
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            });
            orderHelper.failOrCancelOrder(this.order, this.errorMessage);
            expect(stubs.dw.OrderMgrMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order);
            expect(this.order.trackOrderChange).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
            expect(stubs.loggerMock.debug).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match(this.errorMessage));
        });


        it('logs to orderHistory an order does not have the correct status', () => {
            this.order.getStatus.returns({
                value: stubs.dw.OrderMock.ORDER_STATUS_CREATED
            });
            orderHelper.failOrCancelOrder(this.order, this.errorMessage);
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

    context('#setOrderShippingStatus', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.shippedStatus = stubs.dw.OrderMock.SHIPPING_STATUS_SHIPPED;
            this.notShippedStatus = stubs.dw.OrderMock.SHIPPING_STATUS_NOTSHIPPED;
        });

        it('sets an order shippingStatus when current status is differen from desired one', () => {
            this.order.getShippingStatus.returns({
                getValue: () => this.notShippedStatus
            });

            expect(orderHelper.setOrderShippingStatus(this.order, this.shippedStatus)).to.be.undefined();

            expect(this.order.setShippingStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.paidStatus);
            expect(this.order.trackOrderChange).to.have.been.calledOnce();
        });

        it('does not an order shippingStatus when current status is same as desired one', () => {
            this.order.getShippingStatus.returns({
                getValue: () => this.shippedStatus
            });

            expect(orderHelper.setOrderShippingStatus(this.order, this.shippedStatus)).to.be.undefined();

            expect(this.order.setShippingStatus).not.to.have.been.called();
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

    context('#setTransactionCustomProperty', () => {
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
        it('setPaymentDescription', () => {
            orderHelper.setPaymentDescription(this.order, 'paymentMethodID', 'paymentDescription');
            expect(this.paymentTransaction.custom.molliePaymentDescription).to.eql('paymentDescription');
        });
        it('setIssuerData', () => {
            orderHelper.setIssuerData(this.order, 'paymentMethodID', 'issuerData');
            expect(this.paymentTransaction.custom.mollieIssuerData).to.eql('issuerData');
        });
    });

    context('#getTransactionCustomProperty', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.paidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_PAID;
            this.unpaidStatus = stubs.dw.OrderMock.PAYMENT_STATUS_UNPAID;
            this.paymentProcessor = new stubs.dw.PaymentProcessorMock();
            this.paymentProcessor.getID.returns('MOLLIE_PROCESSOR');
            this.paymentTransaction = new stubs.dw.PaymentTransactionMock();
            this.paymentTransaction.custom = {
                molliePaymentStatus: 'paymentStatus',
                molliePaymentId: 'paymentId',
                molliePaymentDescription: 'paymentDescription',
                mollieIssuerData: 'issuerData'
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
        it('getPaymentDescription', () => {
            expect(orderHelper.getPaymentDescription(this.order, 'paymentMethodID')).to.eql('paymentDescription');
        });
        it('getIssuerData', () => {
            expect(orderHelper.getIssuerData(this.order, 'paymentMethodID')).to.eql('issuerData');
        });
        it('returns null if no paymentInstrument is found', () => {
            this.order.getPaymentInstruments.returns({ toArray: () => [] });
            expect(orderHelper.getPaymentId(this.order, 'paymentMethodID')).to.be.null();
        });
    });

    context('#setOrderCustomProperty', () => {
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
        it('setRefundStatus', () => {
            orderHelper.setRefundStatus(this.order, 'refundStatus');
            expect(this.order.custom.mollieRefundStatus).to.eql('refundStatus');
        });
        it('setOrderIsAuthorized', () => {
            orderHelper.setOrderIsAuthorized(this.order, true);
            expect(this.order.custom.mollieOrderIsAuthorized).to.eql(true);
        });
    });

    context('#getOrderCustomProperty', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.order.custom = {
                mollieOrderId: 'orderId',
                mollieOrderStatus: 'orderStatus',
                mollieUsedTransactionAPI: 'usedTransactionAPI',
                mollieRefundStatus: 'refundStatus',
                mollieOrderIsAuthorized: 'orderIsAuthorized'
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
        it('getOrderIsAuthorized', () => {
            expect(orderHelper.getOrderIsAuthorized(this.order)).to.eql('orderIsAuthorized');
        });
    });

    context('#checkMollieRefundStatus', () => {
        beforeEach(() => {
            stubs.configMock.getRefundStatus.returns(REFUND_STATUS);
            this.order = new stubs.dw.OrderMock();
            this.paymentResult = {
                amount: {
                    value: faker.random.number()
                },
                amountRefunded: {}
            };
        });
        it('Should not call setRefundStatus when amountRefunded.value is null', () => {
            orderHelper.checkMollieRefundStatus(this.order, this.paymentResult);

            expect(stubs.orderHelperMock.getRefundStatus).to.not.have.been.called();
            expect(stubs.orderHelperMock.setRefundStatus).to.not.have.been.called();
        });
        it('Should call setRefundStatus when order amount equals refunded amount', () => {
            this.paymentResult.amountRefunded.value = this.paymentResult.amount.value;
            stubs.orderHelperMock.getRefundStatus.returns({ value: REFUND_STATUS.PARTREFUNDED });

            orderHelper.checkMollieRefundStatus(this.order, this.paymentResult);

            expect(stubs.orderHelperMock.getRefundStatus).to.have.been.called();
            expect(stubs.orderHelperMock.setRefundStatus).to.have.been.called()
                .and.to.have.been.called.calledWithExactly(this.order, REFUND_STATUS.REFUNDED);
        });
        it('Should call setRefundStatus when order is not refunded', () => {
            this.paymentResult.amountRefunded.value = faker.random.number();
            stubs.orderHelperMock.getRefundStatus.returns({ value: REFUND_STATUS.NOTREFUNDED });

            orderHelper.checkMollieRefundStatus(this.order, this.paymentResult);

            expect(stubs.orderHelperMock.getRefundStatus).to.have.been.called();
            expect(stubs.orderHelperMock.setRefundStatus).to.have.been.called()
                .and.to.have.been.called.calledWithExactly(this.order, REFUND_STATUS.PARTREFUNDED);
        });
        it('Should not call setRefundStatus when order refund status already is the same as Mollie refund status', () => {
            this.paymentResult.amountRefunded.value = this.paymentResult.amount.value;
            stubs.orderHelperMock.getRefundStatus.returns({ value: REFUND_STATUS.REFUNDED });

            orderHelper.checkMollieRefundStatus(this.order, this.paymentResult);

            expect(stubs.orderHelperMock.setRefundStatus).to.not.have.been.called();
        });
    });
});
