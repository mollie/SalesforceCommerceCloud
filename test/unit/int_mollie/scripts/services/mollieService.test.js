const { stubs } = testHelpers;
const MollieMock = stubs.MollieMock;
const mollieMockInstance = stubs.mollieMockInstance;
const mollieHandlerStub = stubs.mollieHandlerStub;
const paymentConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/payment/paymentConstants`);
const orderConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/order/orderConstants`);
const refundConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/refund/refundConstants`);
const shipmentConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/shipment/shipmentConstants`);
const methodConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/method/methodConstants`);
const customerConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/customer/customerConstants`);
const applePayConstants = require(`${base}/int_mollie/cartridge/scripts/services/mollie/applePay/applePayConstants`);
const constants = { ...paymentConstants, ...orderConstants, ...refundConstants, ...shipmentConstants, ...methodConstants, ...customerConstants, ...applePayConstants };

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieService = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollieService`, {
    '*/cartridge/scripts/services/mollie/payment/createPayment': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/payment/getPayment': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/payment/cancelPayment': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/payment/paymentConstants': paymentConstants,
    '*/cartridge/scripts/services/mollie/order/createOrder': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/order/getOrder': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/order/orderConstants': orderConstants,
    '*/cartridge/scripts/services/mollie/order/cancelOrder': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/order/cancelOrderLineItem': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/refund/createOrderRefund': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/refund/createPaymentRefund': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/refund/refundConstants': refundConstants,
    '*/cartridge/scripts/services/mollie/shipment/createShipment': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/shipment/shipmentConstants': shipmentConstants,
    '*/cartridge/scripts/services/mollie/method/getMethod': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/method/getMethods': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/method/methodConstants': methodConstants,
    '*/cartridge/scripts/services/mollie/customer/createCustomer': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/customer/customerConstants': customerConstants,
    '*/cartridge/scripts/services/mollie/applePay/requestPaymentSession': stubs.mollieHandlerStub,
    '*/cartridge/scripts/services/mollie/applePay/applePayConstants': applePayConstants,
    '*/cartridge/scripts/services/mollie/Mollie': MollieMock
});

const parameters = {
    [faker.lorem.word()]: faker.lorem.word(),
    [faker.lorem.word()]: faker.lorem.word(),
    [faker.lorem.word()]: faker.lorem.word()
};

describe('services/mollieSevice', function () {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    Object.keys(constants).forEach(function (item) {
        const action = item.toLowerCase().replace(/_(\w)/g, function (match, p1) {
            return p1.toUpperCase();
        });
        it('executes a Mollie ' + action + ' action', function () {
            mollieService[action](parameters);

            expect(MollieMock).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(constants[item]);
            expect(mollieMockInstance.addPayloadBuilder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(mollieHandlerStub.payloadBuilder);
            expect(mollieMockInstance.addResponseMapper).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(mollieHandlerStub.responseMapper);
            expect(mollieMockInstance.execute).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(parameters);
        });
    });
});
