/* eslint-disable no-unused-expressions */

const { expect } = require('chai');
const { stubs } = testHelpers;

const DEFAULT_ATTRIBUTE_VALUE = 'default';

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
const mollieEcomCredit = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/processor/mollie_ecom_credit`, {
    'dw/order/PaymentInstrument': stubs.dw.PaymentInstrumentMock,
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    '*/cartridge/scripts/exceptions/PaymentProviderException': stubs.paymentProviderExceptionMock,
    '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock,
    '*/cartridge/scripts/util/collections': {
        forEach: (array, cb) => array.forEach(i => cb(i))
    }
});

describe('payment/processor/mollie_ecom_credit', () => {
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
            this.currentBasket.billingAddress = {
                fullName: faker.lorem.word()
            };
            this.paymentInformation = {
                cardType: {
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

            expect(mollieEcomCredit.Handle(this.currentBasket, this.paymentInformation)).to.have.property('error', false);
            expect(this.currentBasket.createPaymentInstrument).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(stubs.dw.PaymentInstrumentMock.METHOD_CREDIT_CARD, this.currentBasket.totalGrossPrice);
        });

        it('removes existing Mollie paymentInstruments on currentBasket', () => {
            this.currentBasket.getPaymentInstruments.returns([this.paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);

            expect(mollieEcomCredit.Handle(this.currentBasket, this.paymentInformation)).to.have.property('error', false);

            expect(stubs.dw.PaymentMgrMock.getPaymentMethod).to.have.been.calledWith('paymentMethodID');
            expect(this.currentBasket.removePaymentInstrument).to.have.been.calledWith(this.paymentInstrument);
        });

        it('does not remove non-mollie instruments', () => {
            this.paymentProcessor.getID.returns('COUPON_' + faker.random.word());
            this.currentBasket.getPaymentInstruments.returns([this.paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);

            expect(mollieEcomCredit.Handle(this.currentBasket, this.paymentInformation)).to.have.property('error', false);

            expect(stubs.dw.PaymentMgrMock.getPaymentMethod).to.have.been.calledWith('paymentMethodID');
            expect(this.currentBasket.removePaymentInstrument).not.to.have.been.called();
        });
    });

    context('#Authorize', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.orderNo = faker.random.number();
            this.paymentProcessor = faker.random.word();
            this.paymentTransaction = new stubs.dw.PaymentTransactionMock();
            this.paymentMethod = new stubs.dw.PaymentMethodMock();
            this.paymentMethod.custom.mollieEnabledTransactionAPI = { value: DEFAULT_ATTRIBUTE_VALUE };
            this.paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            this.paymentInstrument.getPaymentTransaction.returns(this.paymentTransaction);

            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(this.paymentMethod);
            stubs.configMock.getTransactionAPI.returns(TRANSACTION_API);
            stubs.configMock.getRefundStatus.returns(REFUND_STATUS);
            stubs.configMock.getComponentsEnabled.returns(true);
            stubs.configMock.getEnableSingleClickPayments.returns(true);

            this.cardToken = faker.lorem.word();
            global.session = {
                forms: {
                    billing: {
                        creditCardFields: {
                            cardToken: {
                                value: this.cardToken
                            },
                            saveCard: {
                                checked: false
                            }
                        },
                        isReturningCustomer: {
                            checked: false
                        }
                    }
                }
            };
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

            this.order.getOrderNo.returns(this.orderNo);
            stubs.paymentServiceMock.createPayment.returns(createPaymentResult);
            stubs.configMock.getDefaultAttributeValue.returns(DEFAULT_ATTRIBUTE_VALUE);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.PAYMENT });
            var result = mollieEcomCredit.Authorize(this.order, this.paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createPayment).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, this.paymentMethod,
                    { cardToken: this.cardToken });
            expect(this.order.getOrderNo).to.been.calledOnce();

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

            this.order.getOrderNo.returns(this.orderNo);
            stubs.paymentServiceMock.createOrder.returns(createOrderResult);
            stubs.configMock.getDefaultAttributeValue.returns(DEFAULT_ATTRIBUTE_VALUE);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.ORDER });
            var result = mollieEcomCredit.Authorize(this.order, this.paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createOrder).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, this.paymentMethod,
                    { cardToken: this.cardToken });
            expect(this.order.getOrderNo).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
        it('Authorize payment with order API and passes the customers mollieCustomerId when saveCard is checked', () => {
            global.session.forms.billing.creditCardFields.saveCard.checked = true;
            const redirectUrl = faker.internet.url();
            const mollieCustomerId = faker.random.uuid();
            const createOrderResult = {
                order: {
                    links: {
                        checkout: {
                            href: redirectUrl
                        }
                    }
                }
            };
            this.order.customer = {
                profile: {
                    custom: {
                        mollieCustomerId: mollieCustomerId
                    }
                }
            };

            this.order.getOrderNo.returns(this.orderNo);
            stubs.paymentServiceMock.createOrder.returns(createOrderResult);
            stubs.configMock.getDefaultAttributeValue.returns(DEFAULT_ATTRIBUTE_VALUE);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.ORDER });
            var result = mollieEcomCredit.Authorize(this.order, this.paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);
            expect(stubs.paymentServiceMock.createOrder).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, this.paymentMethod,
                    {
                        cardToken: this.cardToken,
                        customerId: mollieCustomerId
                    });
            expect(this.order.getOrderNo).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
        it('Authorize payment with order API and passes the createCustomer result mollieCustomerId when saveCard is checked', () => {
            global.session.forms.billing.creditCardFields.saveCard.checked = true;
            const redirectUrl = faker.internet.url();
            const mollieCustomerId = faker.random.uuid();
            const createOrderResult = {
                order: {
                    links: {
                        checkout: {
                            href: redirectUrl
                        }
                    }
                }
            };
            const createCustomerResult = {
                customer: {
                    id: mollieCustomerId
                }
            };
            this.order.customer = {
                profile: {
                    custom: {
                        mollieCustomerId: null
                    }
                }
            };
            this.order.getOrderNo.returns(this.orderNo);
            stubs.paymentServiceMock.createOrder.returns(createOrderResult);
            stubs.paymentServiceMock.createCustomer.returns(createCustomerResult);
            stubs.configMock.getDefaultAttributeValue.returns(DEFAULT_ATTRIBUTE_VALUE);
            stubs.configMock.getDefaultEnabledTransactionAPI.returns({ value: TRANSACTION_API.ORDER });
            var result = mollieEcomCredit.Authorize(this.order, this.paymentInstrument, this.paymentProcessor);

            expect(result.redirectUrl).to.eql(redirectUrl);

            expect(stubs.paymentServiceMock.createCustomer).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order.customer.profile);
            expect(stubs.paymentServiceMock.createOrder).to.been.calledOnce()
                .and.to.have.been.calledWithExactly(this.order, this.paymentMethod,
                    {
                        cardToken: this.cardToken,
                        customerId: mollieCustomerId
                    });
            expect(this.order.getOrderNo).to.been.calledOnce();

            expect(result.error).to.be.false;
            expect(result.fieldErrors).to.deep.equal({});
            expect(result.serverErrors).to.be.empty;
        });
    });
});

