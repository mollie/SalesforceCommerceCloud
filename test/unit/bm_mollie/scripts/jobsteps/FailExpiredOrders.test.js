/* eslint-disable new-cap */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

class StatusMock {
    constructor(status, code, message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
StatusMock.OK = 0;
StatusMock.ERROR = 1;

const job = proxyquire(`${base}/bm_mollie/cartridge/scripts/jobsteps/FailExpiredOrders`, {
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    'dw/system/Status': StatusMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/utils/date': stubs.dateMock,
});

global.empty = stubs.sandbox.stub();

describe('bm_mollie/jobsteps/FailExpiredOrders', () => {
    before(() => {
        stubs.init()
        this.orderId = faker.random.uuid();
        this.order = {
            orderNo: this.orderId
        }
    });
    afterEach(() => stubs.reset());
    after(() => stubs.restore());
    beforeEach(() => {
        global.empty.returns(false)
    });

    it('skips the job is IsDisabled flag is set', () => {
        expect(job.Run({ IsDisabled: true })).to.have.property('status', StatusMock.OK);
        expect(stubs.dw.OrderMgrMock.processOrders).not.to.have.been.called();
    });

    it('returns error status when no parameters are passed', () => {
        global.empty.returns(true);
        expect(job.Run()).to.have.property('status', StatusMock.ERROR);
        expect(stubs.dw.OrderMgrMock.processOrders).not.to.have.been.called();
    });

    it('returns error status when something goes wrong', () => {
        stubs.dw.OrderMgrMock.processOrders.throws(new Error('BOOM'));
        expect(job.Run({ IsDisabled: false, ExpireAfterHours: 24 })).to.have.property('status', StatusMock.ERROR);
    });

    it('calls processPaymentUpdate with the given order', () => {
        stubs.dw.OrderMgrMock.processOrders.callsFake(cb => cb(this.order));
        stubs.dateMock.addHours.returns({ getTime: () => 'date-time' });

        expect(job.Run({ IsDisabled: false, ExpireAfterHours: 24 })).to.have.property('status', StatusMock.OK);
        expect(stubs.paymentServiceMock.processPaymentUpdate).to.have.been.calledOnce()
            .and.to.have.been.calledWith(this.order);
        expect(stubs.dw.OrderMgrMock.processOrders).to.have.been.calledWith(sinon.match.func, sinon.match.string, sinon.match.number, 'date-time');
    });
});
