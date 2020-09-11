/* eslint-disable no-unused-expressions */

const { stubs } = testHelpers;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const mollieEcomDefaultFormFrocessor = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/processor/mollie_ecom_default_form_processor`, {
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock
});
describe('payment/processor/mollie_ecom_default_form_processor', () => {
    const cardType = faker.lorem.word();
    before(function () { stubs.init(); });
    beforeEach(function () {
        var paymentMethod = new stubs.dw.PaymentMethodMock();
        paymentMethod.getName.returns(cardType);
        stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
    });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    this.req = {};
    this.paymentForm = {
        paymentMethod: {
            value: faker.lorem.word(),
            htmlName: faker.lorem.word()
        },
        issuer: {
            value: faker.lorem.word(),
            htmlName: faker.lorem.word()
        }
    };
    this.viewFormData = {};

    context('#processForm', () => {
        it('processes a normal redirect payment', () => {
            var result = mollieEcomDefaultFormFrocessor.processForm(this.req, this.paymentForm, this.viewFormData);

            expect(result.error).to.be.false;
            expect(result.viewData.paymentInformation.paymentMethod).to.deep.equal(result.viewData.paymentMethod.value);

            expect(result.viewData.paymentInformation.paymentMethod).to.equal(this.paymentForm.paymentMethod.value);
            expect(result.viewData.paymentInformation.cardType.value).to.equal(cardType);
        });
    });

    context('#savePaymentInformation', () => {
        it('should save payment information', () => {
            var information = mollieEcomDefaultFormFrocessor.savePaymentInformation();
            expect(information).to.be.undefined();
        });
    });
});
