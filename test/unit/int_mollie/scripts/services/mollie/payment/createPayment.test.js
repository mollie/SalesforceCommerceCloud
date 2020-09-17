const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').createPayment);

const paymentStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const createPayment = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/payment/createPayment`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    'dw/web/URLUtils': stubs.dw.URLUtilsMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Payment: paymentStub
    },
    '*/cartridge/scripts/services/mollie/mollieRequestEntities': require(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieRequestEntities`)
});

describe('mollie/createPayment', () => {
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
            this.params = {
                totalGrossPrice: this.currencyStub,
                methodId: faker.lorem.word(),
                description: faker.lorem.word()
            };
            stubs.dw.URLUtilsMock.https.returns(this.returnUrl);
        });

        it('builds a correct payload', () => {
            const payload = createPayment.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Payment: 'value' };
            const response = createPayment.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(paymentStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = createPayment.responseMapper({});
            expect(response).to.eql({ payment: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = createPayment.responseMapper(null);
            expect(response).to.eql({ payment: {}, raw: null });

            response = createPayment.responseMapper();
            expect(response).to.eql({ payment: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = createPayment.responseMapper('string');
            expect(response).to.eql({ payment: {}, raw: 'string' });
        });
    });
});
