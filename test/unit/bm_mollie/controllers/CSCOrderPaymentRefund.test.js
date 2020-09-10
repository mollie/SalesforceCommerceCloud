/* eslint-disable new-cap */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const controller = proxyquire(`${base}/bm_mollie/cartridge/controllers/CSCOrderPaymentRefund`, {
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/helpers/renderTemplateHelper': stubs.renderTemplateHelperMock
});

var order;

describe('bm_mollie/controllers/CSCOrderPaymentRefund', () => {
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
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_order.isml'), {
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
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_payment.isml'), {
                    orderId: order.orderNo,
                    payments: [getPaymentResponse.payment]
                });
        });
        it('renders refund not available template when order has no mollie instruments', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_NEW
            };
            stubs.orderHelperMock.isMollieOrder.returns(false);
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([]);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_not_available.isml'));
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
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_order.isml'), {
                    orderId: order.orderNo,
                    order: getOrderResponse.order
                });
        });
        it('renders refund not available template when order does not exist', () => {
            stubs.dw.OrderMgrMock.getOrder.returns(null);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('refund_not_available.isml'));
        });
        it('renders refund not available template when order is not refundable', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CANCELLED
            };

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('order_payment_refund_not_available.isml'));
        });
    });

    context('#RefundPayment', () => {
        var orderNo;
        var paymentId;
        var amount;
        var currency;
        beforeEach(() => {
            orderNo = faker.random.number();
            paymentId = faker.random.number();
            amount = faker.random.number();
            currency = faker.lorem.word();
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
                            },
                            amount: {
                                stringValue: amount
                            },
                            currency: {
                                stringValue: currency
                            }
                        };
                        return map[value];
                    }
                }
            };
        });
        it('executes a refund payment and renders confirmation template with orderRefund params', () => {
            controller.RefundPayment();

            expect(stubs.paymentServiceMock.createPaymentRefund).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(paymentId, {
                    value: amount,
                    currency: currency
                });
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.createPaymentRefund.throws(new Error('BOOM'));

            controller.RefundPayment();

            expect(stubs.paymentServiceMock.createPaymentRefund).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(paymentId, {
                    value: amount,
                    currency: currency
                });
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });

    context('#RefundOrder', () => {
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
        it('executes a refund payment and renders confirmation template with orderRefund params', () => {
            controller.RefundOrder();

            expect(stubs.paymentServiceMock.createOrderRefund).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [
                    {
                        id: lineId,
                        quantity: quantity
                    }
                ]);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if paymentProvider fails', () => {
            stubs.paymentServiceMock.createOrderRefund.throws(new Error('BOOM'));

            controller.RefundOrder();

            expect(stubs.paymentServiceMock.createOrderRefund).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, [
                    {
                        id: lineId,
                        quantity: quantity
                    }
                ]);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_refund_confirmation.isml'), {
                    success: false,
                    errorMessage: 'BOOM',
                    orderId: orderNo
                });
        });
    });
});
