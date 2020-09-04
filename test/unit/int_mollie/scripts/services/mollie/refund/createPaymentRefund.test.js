const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').createPaymentRefund);

const refundStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const createPaymentRefund = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/refund/createPaymentRefund`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Refund: refundStub
    },
    '*/cartridge/scripts/services/mollie/mollieRequestEntities': require(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieRequestEntities`)
});

describe('mollie/createPaymentRefund', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {
                amount: {
                    value: '4.99',
                    currency: 'EUR'
                }
            };
        });

        it('builds a correct payload', () => {
            const payload = createPaymentRefund.payloadBuilder(this.params);
            console.log(JSON.stringify(payload));
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Refund: 'value' };
            const response = createPaymentRefund.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(refundStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = createPaymentRefund.responseMapper({});
            expect(response).to.eql({ refund: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = createPaymentRefund.responseMapper(null);
            expect(response).to.eql({ refund: {}, raw: null });

            response = createPaymentRefund.responseMapper();
            expect(response).to.eql({ refund: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = createPaymentRefund.responseMapper('string');
            expect(response).to.eql({ refund: {}, raw: 'string' });
        });
    });
});
