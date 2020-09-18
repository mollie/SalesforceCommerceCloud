const { stubs } = testHelpers;

// const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const MollieRequest = require(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieRequest`);

describe('MollieRequest', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    beforeEach(() => {
        this.payload = { key: 'value' };
    });

    it('is constructed with a payload', () => {
        const request = new MollieRequest(this.payload);
        expect(request.payload.key).to.eql(this.payload.key);
    });

    it('toString returns payload stringified', () => {
        const request = new MollieRequest(this.payload);
        expect(request.toString()).to.eql(JSON.stringify(request.payload));
    });

    it('JSON.stringify of the object payload returns as json string', () => {
        const request = new MollieRequest(this.payload);
        expect(JSON.parse(JSON.stringify(request.payload))).to.eql(request.payload);
    });
});
