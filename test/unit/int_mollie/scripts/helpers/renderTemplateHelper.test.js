'use strict';

const { stubs } = testHelpers;

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('scripts/helpers/renderTemplateHelper', () => {
    before(() => { stubs.init(); });
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    var renderTemplateHelper = proxyquire(`${base}/bm_mollie/cartridge/scripts/renderTemplateHelper`, {
        'dw/template/ISML': stubs.dw.ISMLMock,
        '*/cartridge/scripts/utils/logger': stubs.loggerMock,
        '*/cartridge/scripts/utils/superModule': stubs.superModule
    });

    it('should render the template with the given viewParams', function () {
        var template = faker.lorem.word();
        var viewParams = {
            id: faker.random.number()
        };

        renderTemplateHelper.renderTemplate(template, viewParams);

        expect(stubs.dw.ISMLMock.renderTemplate).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(template, viewParams);
    });

    it('should should thrown', function () {
        var template = faker.lorem.word();
        var viewParams = {
            id: faker.random.number()
        };
        stubs.dw.ISMLMock.renderTemplate.throws(new Error('BOOM'));

        expect(() => renderTemplateHelper.renderTemplate(template, viewParams)).to.throw('BOOM');
        expect(stubs.dw.ISMLMock.renderTemplate).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(template, viewParams);
    });
});
