const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

var preferences = {
    siteID: 'siteID',
    mollieEnableTestMode: faker.random.boolean(),
    mollieBearerToken: faker.random.word(),
    mollieBearerTestToken: faker.random.word(),
    mollieDefaultEnabledTransactionAPI: [faker.lorem.word(), faker.lorem.word()],
    mollieDefaultOrderExpiryDays: faker.random.number(),
    mollieEnableSingleClickPayments: faker.random.boolean(),
    mollieComponentsEnabled: faker.random.boolean(),
    mollieComponentsProfileId: faker.lorem.word(),
    mollieLogCategory: faker.random.word()
};

const getConfig = prefs => {
    stubs.dw.Site.getCurrent().getPreferences().getCustom.returns(prefs);
    const config = proxyquire(`${base}/int_mollie/cartridge/scripts/mollieConfig`, {
        'dw/system/Site': stubs.dw.Site,
        '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock
    });

    return config;
};

describe('Config', () => {
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    it('gets siteID', () => {
        expect(getConfig(preferences).getSiteId()).to.eql(preferences.siteID);
    });
    it('gets mollieEnableTestMode', () => {
        expect(getConfig(preferences).getEnableTestMode()).to.eql(preferences.mollieEnableTestMode);
    });
    it('gets mollieBearerToken', () => {
        preferences.mollieEnableTestMode = false;
        expect(getConfig(preferences).getBearerToken()).to.eql(preferences.mollieBearerToken);
    });
    it('gets mollieBearerTestToken', () => {
        preferences.mollieEnableTestMode = true;
        expect(getConfig(preferences).getBearerToken()).to.eql(preferences.mollieBearerTestToken);
    });
    it('gets mollieDefaultEnabledTransactionAPI', () => {
        const defaultenabledTransactionAPI = getConfig(preferences).getDefaultEnabledTransactionAPI();
        expect(defaultenabledTransactionAPI).to.be.an('array');
    });
    it('gets mollieDefaultOrderExpiryDays', () => {
        expect(getConfig(preferences).getDefaultOrderExpiryDays()).to.eql(preferences.mollieDefaultOrderExpiryDays);
    });
    it('gets mollieEnableSingleClickPayments', () => {
        expect(getConfig(preferences).getEnableSingleClickPayments()).to.eql(preferences.mollieEnableSingleClickPayments);
    });
    it('gets mollieComponentsEnabled', () => {
        expect(getConfig(preferences).getComponentsEnabled()).to.eql(preferences.mollieComponentsEnabled);
    });
    it('gets mollieComponentsProfileId', () => {
        expect(getConfig(preferences).getComponentsProfileId()).to.eql(preferences.mollieComponentsProfileId);
    });
    it('gets mollieLogCategory', () => {
        expect(getConfig(preferences).getLogCategory()).to.eql(preferences.mollieLogCategory);
    });
    it('gets transactionstatus', () => {
        const transactionStatus = getConfig(preferences).getTransactionStatus();
        expect(transactionStatus).to.be.an('object');
    });
    it('gets transactionAPI', () => {
        const transactionAPI = getConfig(preferences).getTransactionAPI();
        expect(transactionAPI).to.be.an('object');
    });

    it('throw when sitepreference is missing', () => {
        expect(() => getConfig({})).to.throw();
        expect(stubs.serviceExceptionMock).to.have.been.calledOnce()
            .and.to.have.been.calledWith(sinon.match('You must configure sitePreference by name'));
    });

    it('throws when Site library throws', () => {
        const Site = {
            getCurrent: () => {
                throw new Error('BOOM');
            }
        };
        try {
            proxyquire(`${base}/int_mollie/cartridge/scripts/mollieConfig`, {
                'dw/system/Site': Site,
                '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock
            });
            throw new Error('Test Failed');
        } catch (e) {
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('BOOM'));
        }
    });
});

