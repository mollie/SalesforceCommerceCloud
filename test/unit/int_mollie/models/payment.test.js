'use strict';

const { stubs } = testHelpers;

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('models/payment', () => {
    before(() => { stubs.init(); });
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    var PaymentModel = proxyquire(`${base}/int_mollie/cartridge/models/payment`, {
        'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
        '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
        '*/cartridge/scripts/utils/superModule': stubs.superModule
    });

    it('should call the Mollie service to get the enabled and allowed methods', function () {
        const currentBasket = new stubs.dw.BasketMock();
        currentBasket.totalGrossPrice = { value: faker.random.number() };
        const currentCustomer = new stubs.sandbox.stub();
        const countryCode = faker.lorem.word();
        const paymentMethods = [
            new stubs.dw.PaymentMethodMock(),
            new stubs.dw.PaymentMethodMock(),
            new stubs.dw.PaymentMethodMock()
        ];
        stubs.dw.PaymentMgrMock.getApplicablePaymentMethods.returns(paymentMethods);

        new PaymentModel(currentBasket, currentCustomer, countryCode);
        expect(stubs.paymentServiceMock.getApplicablePaymentMethods).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(paymentMethods, currentBasket, countryCode);
    });
});
