/* eslint-disable new-cap */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const controller = proxyquire(`${base}/bm_mollie/cartridge/controllers/CSCOrderPaymentCancel`, {
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/helpers/renderTemplateHelper': stubs.renderTemplateHelperMock
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
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_order.isml'), {
                    orderId: order.orderNo,
                    order: getOrderResponse.order
                });
        });
        it('renders a template for Mollie payment with viewParams', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            };
            const getPaymentResponse = {
                payment: {
                    id: faker.random.number()
                }
            };
            stubs.orderHelperMock.isMollieOrder.returns(false);
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([paymentInstrument]);
            stubs.paymentServiceMock.getPayment.returns(getPaymentResponse);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_payment.isml'), {
                    orderId: order.orderNo,
                    payments: [getPaymentResponse.payment]
                });
        });
        it('renders cancel not available template when order has no mollie instruments', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            };
            stubs.orderHelperMock.isMollieOrder.returns(false);
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([]);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_not_available.isml'));
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
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_order.isml'), {
                    orderId: order.orderNo,
                    order: getOrderResponse.order
                });
        });
        it('renders cancel not available template when order does not exist', () => {
            stubs.dw.OrderMgrMock.getOrder.returns(null);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('cancel_not_available.isml'));
        });
        it('renders cancel not available template when order is not cancelable', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CANCELLED
            };

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('order_payment_cancel_not_available.isml'));
        });
    });

    context('#CancelPayment', () => {
        var orderNo;
        var paymentId;
        beforeEach(() => {
            orderNo = faker.random.number();
            paymentId = faker.random.number();
            order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.getOrder.returns(order);
            global.request = {
                httpParameterMap: {
                    get: (value) => {
                        const map = {
                            orderId: {
                                stringValue: orderNo
                            },
                            paymentId: {
                                stringValue: paymentId
                            }
                        };
                        return map[value];
                    }
                }
            };
        });
        it('executes a cancel payment and renders confirmation template with orderCancel params', () => {
            controller.CancelPayment();

            expect(stubs.paymentServiceMock.cancelPayment).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(paymentId);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.cancelPayment.throws(new Error('BOOM'));

            controller.CancelPayment();

            expect(stubs.paymentServiceMock.cancelPayment).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(paymentId);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });

    context('#CancelOrderLine', () => {
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
        it('executes a cancel payment and renders confirmation template with orderCancel params', () => {
            controller.CancelOrderLine();

            expect(stubs.paymentServiceMock.cancelOrderLineItem).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [
                    {
                        id: lineId,
                        quantity: quantity
                    }
                ]);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.cancelOrderLineItem.throws(new Error('BOOM'));

            controller.CancelOrderLine();

            expect(stubs.paymentServiceMock.cancelOrderLineItem).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [
                    {
                        id: lineId,
                        quantity: quantity
                    }
                ]);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });

    context('#CancelOrder', () => {
        var orderNo;
        beforeEach(() => {
            orderNo = faker.random.number();
            order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.getOrder.returns(order);
            global.request = {
                httpParameterMap: {
                    get: (value) => {
                        const map = {
                            orderId: {
                                stringValue: orderNo
                            }
                        };
                        return map[value];
                    }
                }
            };
        });
        it('executes a cancel payment and renders confirmation template with orderCancel params', () => {
            controller.CancelOrder();

            expect(stubs.paymentServiceMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.cancelOrder.throws(new Error('BOOM'));

            controller.CancelOrder();

            expect(stubs.paymentServiceMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });
});
