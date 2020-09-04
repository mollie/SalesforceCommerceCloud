const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').getMethod);

const methodStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const getMethod = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/method/getMethod`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Method: methodStub
    }
});

describe('mollie/getMethod', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {};
        });

        it('builds a correct payload', () => {
            const payload = getMethod.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Method: 'value' };
            const response = getMethod.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(methodStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = getMethod.responseMapper({});
            expect(response).to.eql({ method: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = getMethod.responseMapper(null);
            expect(response).to.eql({ method: {}, raw: null });

            response = getMethod.responseMapper();
            expect(response).to.eql({ method: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = getMethod.responseMapper('string');
            expect(response).to.eql({ method: {}, raw: 'string' });
        });
    });
});
