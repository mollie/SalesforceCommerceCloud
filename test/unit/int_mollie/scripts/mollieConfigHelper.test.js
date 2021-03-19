const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

var preferences = {
    siteID: 'siteID',
    siteName: 'siteName',
    mollieEnabledMode: faker.lorem.word(),
    mollieBearerTestToken: faker.lorem.word(),
    mollieBearerToken: faker.lorem.word(),
    mollieProfileId: faker.lorem.word(),
    mollieDefaultEnabledTransactionAPI: [faker.lorem.word(), faker.lorem.word()],
    mollieDefaultOrderExpiryDays: faker.random.number(),
    mollieEnableSingleClickPayments: faker.random.boolean(),
    mollieComponentsEnabled: faker.random.boolean(),
    mollieLogCategory: faker.lorem.word()
};

const mollieConfigHelper = proxyquire(`${base}/int_mollie/cartridge/scripts/mollieConfigHelper`, {
    '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
});

describe('ConfigHelper', () => {
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    it('throw when sitepreference is missing', () => {
        expect(() => mollieConfigHelper.getPreference(preferences, 'UnkownPreference')).to.throw();
        expect(stubs.serviceExceptionMock).to.have.been.calledOnce()
            .and.to.have.been.calledWith(sinon.match('You must configure sitePreference by name'));
    });
});
