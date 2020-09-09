const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const preferences = {
    siteID: 'siteID',
    mollieBearerToken: faker.lorem.word(),
    mollieEnabledTransactionAPI: [faker.lorem.word(), faker.lorem.word()],
    mollieOrderDefaultExpiryDays: faker.random.number(),
    mollieLogCategory: faker.random.word(),
    mollieComponentsEnabled: faker.random.boolean(),
    mollieComponentsEnableTestMode: faker.random.boolean(),
    mollieComponentsProfileId: faker.lorem.word(),
    mollieEnableSingleClickPayments: faker.random.boolean()
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
    it('gets mollieBearerToken', () => {
        expect(getConfig(preferences).getBearerToken()).to.eql(preferences.mollieBearerToken);
    });
    it('gets transactionstatus', () => {
        const transactionStatus = getConfig(preferences).getTransactionStatus();
        expect(transactionStatus).to.be.an('object');
    });
    it('gets transactionAPI', () => {
        const transactionAPI = getConfig(preferences).getTransactionAPI();
        expect(transactionAPI).to.be.an('object');
    });
    it('gets enabledTransactionAPI', () => {
        const enabledTransactionAPI = getConfig(preferences).getEnabledTransactionAPI();
        expect(enabledTransactionAPI).to.be.an('array');
    });
    it('gets mollieOrderDefaultExpiryDays', () => {
        expect(getConfig(preferences).getOrderDefaultExpiryDays()).to.eql(preferences.mollieOrderDefaultExpiryDays);
    });
    it('gets mollieLogCategory', () => {
        expect(getConfig(preferences).getLogCategory()).to.eql(preferences.mollieLogCategory);
    });
    it('gets mollieComponentsEnabled', () => {
        expect(getConfig(preferences).getComponentsEnabled()).to.eql(preferences.mollieComponentsEnabled);
    });
    it('gets mollieComponentsEnableTestMode', () => {
        expect(getConfig(preferences).getComponentsEnableTestMode()).to.eql(preferences.mollieComponentsEnableTestMode);
    });
    it('gets mollieComponentsProfileId', () => {
        expect(getConfig(preferences).getComponentsProfileId()).to.eql(preferences.mollieComponentsProfileId);
    });
    it('gets mollieEnableSingleClickPayments', () => {
        expect(getConfig(preferences).getEnableSingleClickPayments()).to.eql(preferences.mollieEnableSingleClickPayments);
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

