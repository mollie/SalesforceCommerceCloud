const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').getMethods);

const methodStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const getMethods = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/method/getMethods`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieEntities': {
        Method: methodStub
    }
});

describe('mollie/getMethods', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {};
        });

        it('builds a correct payload', () => {
            const payload = getMethods.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const methods = ['value', 'value', 'value'];
            const result = { _embedded: { methods: methods } };
            const response = getMethods.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(methodStub).to.have.been.callCount(methods.length)
                .and.to.have.been.calledWithExactly(methods[1]);
        });

        it('handles result without expected properties', () => {
            let response = getMethods.responseMapper({});
            expect(response).to.eql({ methods: [], raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = getMethods.responseMapper(null);
            expect(response).to.eql({ methods: [], raw: null });

            response = getMethods.responseMapper();
            expect(response).to.eql({ methods: [], raw: null });
        });

        it('handles a string result', () => {
            const response = getMethods.responseMapper('string');
            expect(response).to.eql({ methods: [], raw: 'string' });
        });
    });
});
