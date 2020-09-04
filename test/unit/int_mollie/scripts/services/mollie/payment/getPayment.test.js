const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').getPayment);

const paymentStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const getPayment = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/payment/getPayment`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Payment: paymentStub
    }
});

describe('mollie/getPayment', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {};
        });

        it('builds a correct payload', () => {
            const payload = getPayment.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Payment: 'value' };
            const response = getPayment.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(paymentStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = getPayment.responseMapper({});
            expect(response).to.eql({ payment: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = getPayment.responseMapper(null);
            expect(response).to.eql({ payment: {}, raw: null });

            response = getPayment.responseMapper();
            expect(response).to.eql({ payment: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = getPayment.responseMapper('string');
            expect(response).to.eql({ payment: {}, raw: 'string' });
        });
    });
});
