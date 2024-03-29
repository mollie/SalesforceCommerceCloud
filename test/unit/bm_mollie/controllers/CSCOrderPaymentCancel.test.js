/* eslint-disable new-cap */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const controller = proxyquire(`${base}/bm_mollie/cartridge/controllers/CSCOrderPaymentCancel`, {
    'server': stubs.serverMock,
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/renderTemplateHelper': stubs.renderTemplateHelperMock,
    '*/cartridge/scripts/middleware/csrf': stubs.csrfProtectionMock
});

var order;

describe('bm_mollie/controllers/CSCOrderPaymentCancel', () => {
    before(() => stubs.init());
    afterEach(() => {
        stubs.reset();
        stubs.serverMock.next.reset();
        stubs.serverMock.res.redirect.reset();
        stubs.serverMock.res.json.reset();
        stubs.serverMock.res.render.reset();
    });
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

            controller.Start({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
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

            controller.Start({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
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

            controller.Start({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
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
            stubs.serverMock.res.render.throws(new Error('BOOM'));

            expect(() => controller.Start({}, stubs.serverMock.res, stubs.serverMock.next)).to.throw('BOOM');
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_order.isml'), {
                    orderId: order.orderNo,
                    order: getOrderResponse.order
                });
        });
        it('renders cancel not available template when order does not exist', () => {
            stubs.dw.OrderMgrMock.getOrder.returns(null);

            controller.Start({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('cancel_not_available.isml'));
        });
        it('renders cancel not available template when order is not cancelable', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CANCELLED
            };

            controller.Start({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
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
            controller.CancelPayment({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.paymentServiceMock.cancelPayment).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(paymentId);
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.cancelPayment.throws(new Error('BOOM'));

            controller.CancelPayment({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.paymentServiceMock.cancelPayment).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(paymentId);
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
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
            controller.CancelOrderLine({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.paymentServiceMock.cancelOrderLineItem).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [
                    {
                        id: lineId,
                        quantity: quantity
                    }
                ]);
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.cancelOrderLineItem.throws(new Error('BOOM'));

            controller.CancelOrderLine({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.paymentServiceMock.cancelOrderLineItem).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [
                    {
                        id: lineId,
                        quantity: quantity
                    }
                ]);
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
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
            controller.CancelOrder({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.paymentServiceMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order);
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.cancelOrder.throws(new Error('BOOM'));

            controller.CancelOrder({}, stubs.serverMock.res, stubs.serverMock.next);

            expect(stubs.paymentServiceMock.cancelOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order);
            expect(stubs.serverMock.res.render).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_cancel_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });
});
