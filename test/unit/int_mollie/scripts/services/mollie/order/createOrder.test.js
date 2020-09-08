const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').createOrder);

const orderStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const createOrder = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/order/createOrder`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    'dw/web/URLUtils': stubs.dw.URLUtilsMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Order: orderStub
    },
    '*/cartridge/scripts/utils/date': stubs.dateMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock,
    '*/cartridge/scripts/services/mollie/mollieRequestEntities': require(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieRequestEntities`)
});

describe('mollie/createOrder', () => {
    before(function () {
        stubs.init();
        global.request = {
            getLocale: function () {
                return 'nl_BE';
            }
        };
    });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.returnUrl = faker.internet.url();
            this.amount = {
                value: faker.random.number(),
                currency: 'EUR'
            };
            this.currencyStub = new stubs.dw.CurrencyMock();
            this.currencyStub.getCurrencyCode.returns(this.amount.currency);
            this.currencyStub.getValue.returns(this.amount.value);
            this.orderAddressMock = new stubs.dw.OrderAddressMock();
            this.params = {
                totalGrossPrice: this.currencyStub,
                orderId: faker.random.uuid(),
                billingAddress: this.orderAddressMock,
                email: faker.internet.email(),
                cardToken: faker.lorem.word(),
                issuer: faker.lorem.word(),
                customerId: faker.random.uuid(),
                paymentMethod: {
                    custom: {
                        mollieOrderExpiryDays: faker.random.number(),
                        molliePaymentMethodId: faker.lorem.word()
                    }
                }
            };
            stubs.dw.URLUtilsMock.https.returns(this.returnUrl);
        });

        it('builds a correct payload', () => {
            const payload = createOrder.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Order: 'value' };
            const response = createOrder.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(orderStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = createOrder.responseMapper({});
            expect(response).to.eql({ order: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = createOrder.responseMapper(null);
            expect(response).to.eql({ order: {}, raw: null });

            response = createOrder.responseMapper();
            expect(response).to.eql({ order: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = createOrder.responseMapper('string');
            expect(response).to.eql({ order: {}, raw: 'string' });
        });
    });
});
