/* eslint-disable new-cap */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const controller = proxyquire(`${base}/bm_mollie/cartridge/controllers/CSCOrderShipment`, {
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/renderTemplateHelper': stubs.renderTemplateHelperMock
});

var order;

describe('bm_mollie/controllers/CSCOrderPaymentCancel', () => {
    before(() => stubs.init());
    afterEach(() => stubs.reset());
    after(() => stubs.restore());
    context('#Start', () => {
        beforeEach(() => {
            const orderNo = faker.random.number();
            order = new stubs.dw.OrderMock();
            order.orderNo = orderNo;
            stubs.dw.OrderMgrMock.getOrder.returns(order);
            global.request = {
                httpParameterMap: {
                    get: (value) => {
                        const map = {
                            'order_no': {
                                stringValue: orderNo
                            }
                        };
                        return map[value];
                    }
                }
            };
        });
        it('renders a template for Mollie order with viewParams', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            };
            const getOrderResponse = {
                order: {
                    id: faker.random.number()
                }
            };
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.paymentServiceMock.getOrder.returns(getOrderResponse);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_shipment.isml'), {
                    orderId: order.orderNo,
                    order: getOrderResponse.order
                });
        });
        it('renders shipment not available template when order is paid with Mollie Payment API', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            };

            stubs.orderHelperMock.isMollieOrder.returns(false);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_shipment_not_available.isml'));
        });
        it('throws when rendering template fails', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            };
            const getOrderResponse = {
                order: {
                    id: faker.random.number()
                }
            };
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.paymentServiceMock.getOrder.returns(getOrderResponse);
            stubs.renderTemplateHelperMock.renderTemplate.throws(new Error('BOOM'));

            expect(() => controller.Start()).to.throw('BOOM');
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_shipment.isml'), {
                    orderId: order.orderNo,
                    order: getOrderResponse.order
                });
        });
        it('renders shipment not available template when order does not exist', () => {
            stubs.dw.OrderMgrMock.getOrder.returns(null);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('order_shipment_not_available.isml'));
        });
        it('renders shipment not available template when order is not shippable', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CANCELLED
            };

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('order_shipment_not_available.isml'));
        });
    });

    context('#Shipment', () => {
        var orderNo;
        var lineId;
        var quantity;
        beforeEach(() => {
            orderNo = faker.random.number();
            lineId = faker.random.number();
            quantity = faker.random.number();
            order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.getOrder.returns(order);
            global.request = {
                httpParameterMap: {
                    get: (value) => {
                        const map = {
                            orderId: {
                                stringValue: orderNo
                            },
                            lineId: {
                                stringValue: lineId
                            },
                            quantity: {
                                stringValue: quantity
                            }
                        };
                        return map[value];
                    }
                }
            };
        });
        it('executes a shipment and renders confirmation template with shipment params', () => {
            controller.Shipment();

            expect(stubs.paymentServiceMock.createShipment).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [{
                    id: lineId,
                    quantity: quantity
                }]);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_shipment_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.createShipment.throws(new Error('BOOM'));

            controller.Shipment();

            expect(stubs.paymentServiceMock.createShipment).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [{
                    id: lineId,
                    quantity: quantity
                }]);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_shipment_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });
});
