/* eslint-disable no-unused-expressions */

const { expect } = require('chai');
const { stubs } = testHelpers;

const TRANSACTION_API = {
    PAYMENT: 'payment',
    ORDER: 'order'
};

const REFUND_STATUS = {
    NOTREFUNDED: 'REFUND_STATUS_NOTREFUNDED',
    PARTREFUNDED: 'REFUND_STATUS_PARTREFUNDED',
    REFUNDED: 'REFUND_STATUS_REFUNDED'
};

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieEcomDefault = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/processor/mollie_ecom_default`, {
    'dw/web/Resource': stubs.dw.ResourceMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/util/collections': {
        forEach: (array, cb) => array.forEach(i => cb(i))
    },
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock
});

describe('payment/processor/mollie_ecom_default', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });
    beforeEach(() => {
        this.order = new stubs.dw.OrderMock();
    });

    context('#Handle', () => {
        beforeEach(() => {
            this.currentBasket = new stubs.dw.BasketMock();
            this.currentBasket.totalGrossPrice = faker.random.number();
            this.paymentInformation = {
                paymentMethod: faker.lorem.word(),
                issuer: {
                    value: faker.lorem.word()
                }
            };

            this.paymentProcessor = new stubs.dw.PaymentProcessorMock();
            this.paymentProcessor.getID.returns('MOLLIE_' + faker.random.word());

            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.getPaymentProcessor.returns(this.paymentProcessor);

            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentMethod.returns('paymentMethodID');

            this.createdInstrument = new stubs.dw.PaymentInstrumentMock();
            this.currentBasket.createPaymentInstrument.returns(this.createdInstrument);
            this.paymentTransaction = new stubs.dw.PaymentTransactionMock();
            this.createdInstrument.getPaymentTransaction.returns(this.paymentTransaction);
        });

        it('creates a new paymentInstrument for the current basket', () => {
            this.currentBasket.getPaymentInstruments.returns([]);

            expect(mollieEcomDefault.Handle(this.currentBasket, this.paymentInformation)).to.have.property('error', false);
            expect(this.currentBasket.createPaymentInstrument).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.paymentInformation.paymentMethod, this.currentBasket.totalGrossPrice);
        });

        it('removes existing Mollie paymentInstruments on currentBasket', () => {
            this.currentBasket.getPaymentInstruments.returns([this.paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);

            expect(mollieEcomDefault.Handle(this.currentBasket, this.paymentInformation)).to.have.property('error', false);

            expect(stubs.dw.PaymentMgrMock.getPaymentMethod).to.have.been.calledWith('paymentMethodID');
            expect(this.currentBasket.removePaymentInstrument).to.have.been.calledWith(this.paymentInstrument);
        });

        it('does not remove non-mollie instruments', () => {
            this.paymentProcessor.getID.returns('COUPON_' + faker.random.word());
            this.currentBasket.getPaymentInstruments.returns([this.paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);

            expect(mollieEcomDefault.Handle(this.currentBasket, this.paymentInformation)).to.have.property('error', false);

            expect(stubs.dw.PaymentMgrMock.getPaymentMethod).to.have.been.calledWith('paymentMethodID');
            expect(this.currentBasket.removePaymentInstrument).not.to.have.been.called();
        });
    });

    context('#Authorize', () => {
        beforeEach(() => {
            this.orderNumber = faker.random.number();
            this.paymentProcessor = faker.random.word();
            this.paymentTransaction = new stubs.dw.PaymentTransactionMock();
            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.custom.mollieEnabledTransactionAPI = {};
            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentTransaction.returns(this.paymentTransaction);

            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);
            stubs.configMock.getTransactionAPI.returns(TRANSACTION_API);
            stubs.configMock.getRefundStatus.returns(REFUND_STATUS);
        });
        it('Authorize payment with payment API', () => {
            const redirectUrl = faker.internet.url();
            const createPaymentResult = {
                payment: {
                    links: {
                        checkout: {
                            href: redirectUrl
                        }
                    }
                }
            };

            stubs.dw.OrderMgrMock.getOrder.returns(this.order);
            stubs.paymentServiceMock.createPayment.returns(createPaymentResult);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.PAYMENT });
            const issuerId = faker.random.number();
            stubs.orderHelperMock.getIssuerData.returns(`{ "id": ${issuerId} }`);
            var result = mollieEcomDefault.Authorize(this.orderNumber, this.paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createPayment).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, this.paymentMethod, { issuer: issuerId });
            expect(stubs.dw.OrderMgrMock.getOrder).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
        it('Authorize payment with order API', () => {
            const redirectUrl = faker.internet.url();
            const createOrderResult = {
                order: {
                    links: {
                        checkout: {
                            href: redirectUrl
                        }
                    }
                }
            };

            stubs.dw.OrderMgrMock.getOrder.returns(this.order);
            stubs.paymentServiceMock.createOrder.returns(createOrderResult);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.ORDER });
            const issuerId = faker.random.number();
            stubs.orderHelperMock.getIssuerData.returns(`{ "id": ${issuerId} }`);
            var result = mollieEcomDefault.Authorize(this.orderNumber, this.paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createOrder).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, this.paymentMethod, { issuer: issuerId });
            expect(stubs.dw.OrderMgrMock.getOrder).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
    });
});
