const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('utils/logger', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    it('instantiates a dw logger instance with a custom category', () => {
        stubs.dw.loggerMock.getLogger.returns('logInstance');
        stubs.configMock.getLogCategory.returns('logCategory');

        const logger = proxyquire(`${base}/int_mollie/cartridge/scripts/utils/logger`, {
            'dw/system/Logger': stubs.dw.loggerMock,
            '*/cartridge/scripts/mollieConfig': stubs.configMock
        });

        expect(logger).to.eql('logInstance');
        expect(stubs.dw.loggerMock.getLogger).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly('logCategory');
    });
});
