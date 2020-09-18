/* eslint-disable new-cap */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const controller = proxyquire(`${base}/bm_mollie/cartridge/controllers/CSCOrderPaymentLink`, {
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock,
    '*/cartridge/scripts/helpers/renderTemplateHelper': stubs.renderTemplateHelperMock,
    'dw/system/HookMgr': stubs.dw.HookMgrMock,
    '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock
});

var order;

describe('bm_mollie/controllers/CSCOrderPaymentLink', () => {
    before(() => stubs.init());
    afterEach(() => stubs.reset());
    after(() => stubs.restore());
    context('#Start', () => {
        var orderNo;
        beforeEach(() => {
            orderNo = faker.random.number();
            order = new stubs.dw.OrderMock();
            order.orderNo = orderNo;
            order.customer = {
                profile: {
                    email: faker.internet.email()
                }
            };
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
                value: stubs.dw.OrderMock.ORDER_STATUS_CREATED
            };
            const paymentLink = faker.internet.url();
            const getOrderResponse = {
                order: {
                    id: faker.random.number(),
                    links: {
                        checkout: {
                            href: paymentLink
                        }
                    }
                }
            };
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.paymentServiceMock.getOrder.returns(getOrderResponse);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_link_send.isml'), {
                    paymentLink: paymentLink,
                    orderId: orderNo,
                    email: order.customer.profile.email
                });
        });
        it('renders a template for Mollie payment with viewParams', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CREATED
            };
            const paymentLink = faker.internet.url();
            const getPaymentResponse = {
                payment: {
                    id: faker.random.number(),
                    links: {
                        checkout: {
                            href: paymentLink
                        }
                    }
                }
            };
            stubs.orderHelperMock.isMollieOrder.returns(false);
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([paymentInstrument]);
            stubs.paymentServiceMock.getPayment.returns(getPaymentResponse);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_link_send.isml'), {
                    paymentLink: paymentLink,
                    orderId: orderNo,
                    email: order.customer.profile.email
                });
        });
        it('renders link not available template when order has no mollie instruments', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CREATED
            };
            stubs.orderHelperMock.isMollieOrder.returns(false);
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([]);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_link_not_available.isml'));
        });
        it('throws when rendering template fails', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CREATED
            };
            const paymentLink = faker.internet.url();
            const getOrderResponse = {
                order: {
                    id: faker.random.number(),
                    links: {
                        checkout: {
                            href: paymentLink
                        }
                    }
                }
            };
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.paymentServiceMock.getOrder.returns(getOrderResponse);
            stubs.renderTemplateHelperMock.renderTemplate.throws(new Error('BOOM'));

            expect(() => controller.Start()).to.throw('BOOM');
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_link_send.isml'), {
                    paymentLink: paymentLink,
                    orderId: orderNo,
                    email: order.customer.profile.email
                });
        });
        it('renders link not available template when order does not exist', () => {
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.dw.OrderMgrMock.getOrder.returns(null);

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('order_payment_link_not_available.isml'));
        });
        it('renders link not available template when link is not available', () => {
            order.status = {
                value: stubs.dw.OrderMock.ORDER_STATUS_CANCELLED
            };

            controller.Start();

            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('order_payment_link_not_available.isml'));
        });
    });

    context('#SendMail', () => {
        var orderNo;
        var paymentLink;
        var email;
        beforeEach(() => {
            orderNo = faker.random.number();
            paymentLink = faker.internet.url();
            email = faker.internet.email();
            order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.getOrder.returns(order);
            global.request = {
                httpParameterMap: {
                    get: (value) => {
                        const map = {
                            orderId: {
                                stringValue: orderNo
                            },
                            paymentLink: {
                                stringValue: paymentLink
                            },
                            email: {
                                stringValue: email
                            }
                        };
                        return map[value];
                    }
                }
            };
        });
        it('executes a link and renders confirmation template with orderLink params', () => {
            stubs.dw.HookMgrMock.hasHook.returns(true);

            controller.SendMail();

            expect(stubs.dw.HookMgrMock.callHook).to.have.been.calledOnce()
                .and.to.have.been.calledWith('mollie.send.payment.link', 'sendPaymentLink', order, email, paymentLink);
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_link_confirmation.isml'), {
                    success: true,
                    orderId: orderNo
                });
        });
        it('renders an error if there is no send mail hook', () => {
            stubs.dw.HookMgrMock.hasHook.returns(false);

            controller.SendMail();

            expect(stubs.dw.HookMgrMock.callHook).to.not.have.been.called();
            expect(stubs.renderTemplateHelperMock.renderTemplate).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(sinon.match('order_payment_link_confirmation.isml'), {
                    success: false,
                    errorMessage: sinon.match('not supported'),
                    orderId: orderNo
                });
        });
    });
});
