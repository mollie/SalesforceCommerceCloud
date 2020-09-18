const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const date = proxyquire(`${base}/int_mollie/cartridge/scripts/utils/date`, {
    'dw/util/Calendar': stubs.dw.CalendarMock,
    'dw/util/StringUtils': stubs.dw.StringUtilsMock
});
const Calendar = require('../../../_helpers/mocks/dw/util/Calendar');

describe('utils/dateUtil', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    it('#now: returns new calendar instance', () => {
        const calendar = date.now();
        expect(stubs.dw.CalendarMock).to.have.been.called();
        expect(calendar).to.be.instanceOf(Calendar);
    });

    it('#addDays: returns new calendar instance', () => {
        const calendar = new Calendar();
        calendar.add = stubs.sandbox.stub();

        date.addDays(calendar, 10);
        expect(calendar.add).to.have.been.calledWith(stubs.dw.CalendarMock.DATE, 10);
    });

    it('#addDays: adds 0 days by default', () => {
        const calendar = new Calendar();
        calendar.add = stubs.sandbox.stub();

        date.addDays(calendar);
        expect(calendar.add).to.have.been.calledWith(stubs.dw.CalendarMock.DATE, 0);
    });

    it('#addHours: returns new calendar instance', () => {
        const calendar = new Calendar();
        calendar.add = stubs.sandbox.stub();

        date.addHours(calendar, 10);
        expect(calendar.add).to.have.been.calledWith(stubs.dw.CalendarMock.HOUR, 10);
    });

    it('#addHours: adds 0 days by default', () => {
        const calendar = new Calendar();
        calendar.add = stubs.sandbox.stub();

        date.addHours(calendar);
        expect(calendar.add).to.have.been.calledWith(stubs.dw.CalendarMock.HOUR, 0);
    });
});
