const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').createShipment);

const shipmentStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const createShipment = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/shipment/createShipment`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Shipment: shipmentStub
    }
});

describe('mollie/createShipment', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.params = {};
        });

        it('builds a correct payload', () => {
            const payload = createShipment.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Shipment: 'value' };
            const response = createShipment.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(shipmentStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = createShipment.responseMapper({});
            expect(response).to.eql({ shipment: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = createShipment.responseMapper(null);
            expect(response).to.eql({ shipment: {}, raw: null });

            response = createShipment.responseMapper();
            expect(response).to.eql({ shipment: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = createShipment.responseMapper('string');
            expect(response).to.eql({ shipment: {}, raw: 'string' });
        });
    });
});
