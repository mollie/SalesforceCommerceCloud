/* eslint-disable no-unused-expressions */

const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieEcomCreditFormProcessor = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/processor/mollie_ecom_credit_form_processor`, {
    'dw/web/Resource': stubs.dw.ResourceMock,
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock
});

describe('payment/processor/mollie_ecom_credit_form_processor', () => {
    const cardType = faker.lorem.word();
    before(function () { stubs.init(); });
    beforeEach(function () {
        var paymentMethod = new stubs.dw.PaymentMethodMock();
        paymentMethod.getName.returns(cardType);
        stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
    });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    this.req = {
        session: {
            privacyCache: {}
        }
    };
    this.paymentForm = {
        paymentMethod: {
            value: faker.lorem.word(),
            htmlName: faker.lorem.word()
        },
        creditCardFields: {
            cardToken: {
                value: faker.lorem.word(),
                htmlName: faker.lorem.word()
            },
            saveCard: {
                checked: false
            },
            cardType: {
                htmlName: faker.lorem.word()
            }
        },
        isReturningCustomer: {
            checked: false
        }
    };
    this.viewFormData = {};

    context('#processForm', () => {
        it('processes an alias form', () => {
            this.req.session.privacyCache.get = () => true;

            var result = mollieEcomCreditFormProcessor.processForm(this.req, this.paymentForm, this.viewFormData);

            expect(result.error).to.be.false;
            expect(result.viewData.paymentInformation.paymentMethod).to.deep.equal(result.viewData.paymentMethod.value);

            expect(result.viewData.paymentInformation.paymentMethod).to.equal(this.paymentForm.paymentMethod.value);
            expect(result.viewData.paymentInformation.cardType.value).to.equal(cardType);

            expect(result.viewData.saveCard).to.equal(this.paymentForm.creditCardFields.saveCard.checked);
        });

        it('processes a credit card form', () => {
            this.req.session.privacyCache.get = () => false;

            var result = mollieEcomCreditFormProcessor.processForm(this.req, this.paymentForm, this.viewFormData);

            expect(result.error).to.be.false;
            expect(result.viewData.paymentInformation.paymentMethod).to.deep.equal(result.viewData.paymentMethod.value);

            expect(result.viewData.paymentInformation.paymentMethod).to.equal(this.paymentForm.paymentMethod.value);
            expect(result.viewData.paymentInformation.cardType.value).to.equal(cardType);

            expect(result.viewData.saveCard).to.equal(this.paymentForm.creditCardFields.saveCard.checked);
        });

        it('processes a credit card form but returns validation errors', () => {
            this.req.session.privacyCache.get = () => false;
            this.paymentForm.creditCardFields.cardToken.value = null;

            var result = mollieEcomCreditFormProcessor.processForm(this.req, this.paymentForm, this.viewFormData);

            expect(result.error).to.be.true;
        });
    });

    context('#savePaymentInformation', () => {
        it('should save payment information', () => {
            var information = mollieEcomCreditFormProcessor.savePaymentInformation();
            expect(information).to.be.undefined();
        });
    });
});
