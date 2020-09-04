const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').getOrder);

const orderStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const getOrder = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/order/getOrder`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Order: orderStub
    }
});

describe('mollie/getOrder', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {};
        });

        it('builds a correct payload', () => {
            const payload = getOrder.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Order: 'value' };
            const response = getOrder.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(orderStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = getOrder.responseMapper({});
            expect(response).to.eql({ order: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = getOrder.responseMapper(null);
            expect(response).to.eql({ order: {}, raw: null });

            response = getOrder.responseMapper();
            expect(response).to.eql({ order: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = getOrder.responseMapper('string');
            expect(response).to.eql({ order: {}, raw: 'string' });
        });
    });
});
