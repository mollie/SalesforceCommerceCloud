'use strict';

const { expect } = require('chai');

const { stubs } = testHelpers;

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const PaymentModel = proxyquire(`${base}/int_mollie/cartridge/models/payment`, {
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    '*/cartridge/scripts/utils/superModule': stubs.superModule,
    '*/cartridge/scripts/util/collections': require('../../../_helpers/mocks/util/collections')
});

describe('models/payment', () => {
    before(() => stubs.init());
    beforeEach(() => {
        const molliePaymentMethodId = faker.random.uuid();
        const url = faker.internet.url();
        const paymentMethodsInner = [
            {
                ID: faker.random.word(),
                name: faker.random.word(),
                image: {
                    URL: {
                        toString: () => url
                    }
                },
                custom: {}
            },
            {
                ID: faker.random.word(),
                name: faker.random.word(),
                image: {
                    URL: {
                        toString: () => url
                    }
                },
                custom: {
                    molliePaymentMethodId: molliePaymentMethodId
                }
            }
        ];
        this.paymentMethods = {
            toArray: () => {
                return paymentMethodsInner;
            }
        };
    });
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    it('Should take payment methods and convert to a plain object with the image included', () => {
        const currentBasket = new stubs.dw.BasketMock();
        currentBasket.totalGrossPrice = { value: faker.random.number() };
        const currentCustomer = new stubs.sandbox.stub();
        const countryCode = faker.address.countryCode();
        const paymentMethods = this.paymentMethods.toArray();
        stubs.dw.PaymentMgrMock.getApplicablePaymentMethods.returns(this.paymentMethods);

        var paymentModel = new PaymentModel(currentBasket, currentCustomer, countryCode);

        expect(paymentModel.applicablePaymentMethods.length).to.eql(2);
        expect(paymentModel.applicablePaymentMethods[0].ID).to.eql(paymentMethods[0].ID);
        expect(paymentModel.applicablePaymentMethods[0].name).to.eql(paymentMethods[0].name);
        expect(paymentModel.applicablePaymentMethods[0].image).to.eql(paymentMethods[0].image.URL.toString());
        expect(paymentModel.applicablePaymentMethods[1].ID).to.eql(paymentMethods[1].ID);
        expect(paymentModel.applicablePaymentMethods[1].name).to.eql(paymentMethods[1].name);
        expect(paymentModel.applicablePaymentMethods[1].image).to.eql(paymentMethods[1].image.URL.toString());
    });
});
