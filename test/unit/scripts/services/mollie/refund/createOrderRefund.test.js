const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').createPaymentRefund);

const refundStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const createOrderRefund = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/refund/createOrderRefund`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieEntities': {
        Refund: refundStub
    },
    '*/cartridge/scripts/services/mollie/sfccEntities': require(`${base}/int_mollie/cartridge/scripts/services/mollie/sfccEntities`)
});

describe('mollie/createOrderRefund', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.amount = {
                value: '5.99',
                currency: 'EUR'
            }
            this.currencyStub = new stubs.dw.CurrencyMock();
            this.currencyStub.getCurrencyCode.returns(this.amount.currency);
            this.currencyStub.getValue.returns(this.amount.value); 
            this.params = {
                amount: this.currencyStub
            };
        });

        it('builds a correct payload', () => {
            const payload = createOrderRefund.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Refund: 'value' };
            const response = createOrderRefund.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(refundStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = createOrderRefund.responseMapper({});
            expect(response).to.eql({ refund: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = createOrderRefund.responseMapper(null);
            expect(response).to.eql({ refund: {}, raw: null });

            response = createOrderRefund.responseMapper();
            expect(response).to.eql({ refund: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = createOrderRefund.responseMapper('string');
            expect(response).to.eql({ refund: {}, raw: 'string' });
        });
    });
});
