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

var fieldSettings = { Test: faker.random.number() };

const getConfig = prefs => {
    stubs.dw.Site.getCurrent().getPreferences().getCustom.returns(prefs);
    const config = proxyquire(`${base}/int_mollie/cartridge/scripts/mollieConfig`, {
        'dw/system/Site': stubs.dw.Site,
        '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
        '*/cartridge/scripts/customPageFieldSettings': fieldSettings,
        '*/cartridge/scripts/mollieConfigHelper': stubs.mollieConfigHelperMock
    });

    return config;
};

describe('Config', () => {
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    it('gets siteID', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.siteID);
        expect(getConfig(preferences).getSiteId()).to.eql(preferences.siteID);
    });
    it('gets siteName', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.siteName);
        expect(getConfig(preferences).getSiteName()).to.eql(preferences.siteName);
    });
    it('gets mollieEnabledMode', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieEnabledMode);
        expect(getConfig(preferences).getEnabledMode()).to.eql(preferences.mollieEnabledMode);
    });
    it('gets mollieBearerToken', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieBearerToken);
        preferences.mollieEnabledMode = { value: 'LIVE' };
        expect(getConfig(preferences).getBearerToken()).to.eql(preferences.mollieBearerToken);
    });
    it('gets mollieBearerTestToken', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieBearerTestToken);
        preferences.mollieEnabledMode = { value: 'TEST' };
        expect(getConfig(preferences).getBearerToken()).to.eql(preferences.mollieBearerTestToken);
    });
    it('gets mollieDefaultEnabledTransactionAPI', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieDefaultEnabledTransactionAPI);
        const defaultenabledTransactionAPI = getConfig(preferences).getDefaultEnabledTransactionAPI();
        expect(defaultenabledTransactionAPI).to.be.an('array');
    });
    it('gets mollieDefaultOrderExpiryDays', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieDefaultOrderExpiryDays);
        expect(getConfig(preferences).getDefaultOrderExpiryDays()).to.eql(preferences.mollieDefaultOrderExpiryDays);
    });
    it('gets mollieEnableSingleClickPayments', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieEnableSingleClickPayments);
        expect(getConfig(preferences).getEnableSingleClickPayments()).to.eql(preferences.mollieEnableSingleClickPayments);
    });
    it('gets mollieComponentsEnabled', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieComponentsEnabled);
        expect(getConfig(preferences).getComponentsEnabled()).to.eql(preferences.mollieComponentsEnabled);
    });
    it('gets mollieProfileId', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieProfileId);
        expect(getConfig(preferences).getProfileId()).to.eql(preferences.mollieProfileId);
    });
    it('gets mollieLogCategory', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieLogCategory);
        expect(getConfig(preferences).getLogCategory()).to.eql(preferences.mollieLogCategory);
    });
    it('gets customPageFieldSettings', () => {
        expect(getConfig(preferences).getCustomPageFieldSettings()).to.eql(fieldSettings);
    });
    it('gets transactionstatus', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieBearerToken);
        const transactionStatus = getConfig(preferences).getTransactionStatus();
        expect(transactionStatus).to.be.an('object');
    });
    it('gets transactionAPI', () => {
        stubs.mollieConfigHelperMock.getPreference.returns(preferences.mollieBearerToken);
        const transactionAPI = getConfig(preferences).getTransactionAPI();
        expect(transactionAPI).to.be.an('object');
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
                '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
                '*/cartridge/scripts/customPageFieldSettings': fieldSettings,
                '*/cartridge/scripts/mollieConfigHelper': stubs.mollieConfigHelperMock
            });
            throw new Error('Test Failed');
        } catch (e) {
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('BOOM'));
        }
    });
});
