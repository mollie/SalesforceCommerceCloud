const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').requestPaymentSession);

const applePayResponseStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const requestPaymentSession = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/applePay/requestPaymentSession`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        ApplePayResponse: applePayResponseStub
    }
});

describe('mollie/requestPaymentSession', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {
                validationURL: faker.internet.url()
            };
        });

        it('builds a correct payload', () => {
            const payload = requestPaymentSession.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { applePayResponse: 'value' };
            const response = requestPaymentSession.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(applePayResponseStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = requestPaymentSession.responseMapper({});
            expect(response).to.eql({ applePayResponse: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = requestPaymentSession.responseMapper(null);
            expect(response).to.eql({ applePayResponse: {}, raw: null });

            response = requestPaymentSession.responseMapper();
            expect(response).to.eql({ applePayResponse: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = requestPaymentSession.responseMapper('string');
            expect(response).to.eql({ applePayResponse: {}, raw: 'string' });
        });
    });
});
