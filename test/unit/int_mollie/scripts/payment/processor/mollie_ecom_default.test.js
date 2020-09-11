/* eslint-disable no-unused-expressions */

const { expect } = require('chai');
const { stubs } = testHelpers;

const Basket = stubs.dw.BasketMock;
const PaymentInstrument = stubs.dw.PaymentInstrumentMock;
const PaymentMethod = stubs.dw.PaymentMethodMock;
const PaymentProcessor = stubs.dw.PaymentProcessorMock;

const TRANSACTION_API = {
    PAYMENT: 'payment',
    ORDER: 'order'
};

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieEcomDefault = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/processor/mollie_ecom_default`, {
    'dw/web/Resource': stubs.dw.ResourceMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/util/collections': {
        forEach: (array, cb) => array.forEach(i => cb(i))
    },
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock
});

describe('payment/processor/mollie_ecom_default', () => {
    before(function () {
        stubs.init();
        global.session = {
            forms: {
                billing: {
                    issuer: {
                        value: faker.lorem.word()
                    }
                }
            }
        };
    });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });
    beforeEach(() => {
        this.order = new stubs.dw.OrderMock();
    });

    context('#Handle', () => {
        beforeEach(() => {
            // BASKET
            this.currentBasket = new Basket();
            this.currentBasket.totalGrossPrice = faker.random.number();
            this.paymentInformation = { paymentMethod: faker.lorem.word() };
            // PAYMENT_PROCESSOR
            this.paymentProcessor = new PaymentProcessor();
            this.paymentProcessor.getID.returns('MOLLIE_' + faker.random.word());
            // PAYMENT_METHOD
            this.paymentMethod = new PaymentMethod();
            this.paymentMethod.getPaymentProcessor.returns(this.paymentProcessor);
            // PAYMENT_INSTRUMENT
            this.paymentInstrument = new PaymentInstrument();
            this.paymentInstrument.getPaymentMethod.returns('paymentMethodID');
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
        this.orderNumber = faker.random.number();
        this.paymentProcessor = faker.random.word();
        it('Authorize payment with payment API', () => {
            const redirectUrl = faker.internet.url();
            const payment = {
                payment: {
                    links: {
                        checkout: {
                            href: redirectUrl
                        }
                    }
                }
            };
            const paymentMethodMock = new stubs.dw.PaymentMethodMock();
            const paymentTransaction = {
                setTransactionID: () => this.orderNumber,
                setPaymentProcessor: () => this.paymentProcessor
            };
            const paymentInstrument = {
                getPaymentTransaction: () => paymentTransaction,
                getPaymentMethod: () => paymentMethodMock
            };
            stubs.dw.OrderMgrMock.getOrder.returns(this.order);
            stubs.paymentServiceMock.createPayment.returns(payment);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.PAYMENT });
            stubs.configMock.getTransactionAPI.returns(TRANSACTION_API);
            var result = mollieEcomDefault.Authorize(this.orderNumber, paymentInstrument, this.paymentProcessor);
            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createPayment).to.been.calledOnce();
            expect(stubs.dw.OrderMgrMock.getOrder).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
        it('Authorize payment with order API', () => {
            const redirectUrl = faker.internet.url();
            const order = {
                order: {
                    links: {
                        checkout: {
                            href: redirectUrl
                        }
                    }
                }
            };
            const paymentMethodMock = new stubs.dw.PaymentMethodMock();
            const paymentTransaction = {
                setTransactionID: () => this.orderNumber,
                setPaymentProcessor: () => this.paymentProcessor
            };
            const paymentInstrument = {
                getPaymentTransaction: () => paymentTransaction,
                getPaymentMethod: () => paymentMethodMock
            };
            stubs.dw.OrderMgrMock.getOrder.returns(this.order);
            stubs.paymentServiceMock.createOrder.returns(order);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.ORDER });
            stubs.configMock.getTransactionAPI.returns(TRANSACTION_API);
            var result = mollieEcomDefault.Authorize(this.orderNumber, paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createOrder).to.been.calledOnce();
            expect(stubs.dw.OrderMgrMock.getOrder).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
    });
});
