const { expect } = require('chai');

const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const paymentService = proxyquire(`${base}/int_mollie/cartridge/scripts/payment/paymentService`, {
    'dw/web/URLUtils': stubs.dw.URLUtilsMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    '*/cartridge/scripts/services/mollieService': stubs.mollieServiceMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock,
    '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
    '*/cartridge/scripts/payment/paymentHelper': stubs.paymentHelperMock,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock
});

const TRANSACTION_API = {
    PAYMENT: 'payment',
    ORDER: 'order'
};

describe('payment/paymentService', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });
    beforeEach(() => {
        stubs.configMock.getTransactionAPI.returns(TRANSACTION_API);
    });

    context('#getPayment', () => {
        it('Should call getPayment', () => {
            const paymentId = faker.random.uuid();

            paymentService.getPayment(paymentId);

            expect(stubs.mollieServiceMock.getPayment).have.to.been.calledOnce();
        });
    });
    context('#getOrder', () => {
        it('Should call getOrder', () => {
            const orderId = faker.random.uuid();

            paymentService.getOrder(orderId);

            expect(stubs.mollieServiceMock.getOrder).have.to.been.calledOnce();
        });
    });
    context('#createPayment', () => {
        it('Should call createPayment', () => {
            const order = new stubs.dw.OrderMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            const createPaymentResult = {
                payment: {
                    id: faker.random.uuid()
                }
            };
            stubs.mollieServiceMock.createPayment.returns(createPaymentResult);

            var result = paymentService.createPayment(order, paymentMethod, {});

            expect(stubs.mollieServiceMock.createPayment).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.setUsedTransactionAPI).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.setPaymentId).have.to.been.calledOnce();
            expect(result).to.eql(createPaymentResult);
        });
    });
    context('#processPaymentUpdate', () => {
        beforeEach(() => {
            this.order = new stubs.dw.OrderMock();
            this.processPaymentResultResult = {
                url: faker.internet.url()
            };
            stubs.paymentHelperMock.processPaymentResult.returns(this.processPaymentResultResult);
        });
        it('Should process payment update for Mollie order', () => {
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.paymentServiceMock.getOrder.returns({
                order: {}
            });

            var url = paymentService.processPaymentUpdate(this.order);

            expect(stubs.paymentHelperMock.processPaymentResult).have.to.been.calledOnce();
            expect(url).to.eql(this.processPaymentResultResult.url);
        });
        it('Should process payment update for Mollie payment', () => {
            stubs.orderHelperMock.isMollieOrder.returns(false);
            stubs.paymentServiceMock.getPayment.returns({
                payment: {}
            });

            var url = paymentService.processPaymentUpdate(this.order);

            expect(stubs.paymentHelperMock.processPaymentResult).have.to.been.calledOnce();
            expect(url).to.eql(this.processPaymentResultResult.url);
        });
        it('Should call processPaymentResult when order id does match statusUpdateId', () => {
            const statusUpdateId = faker.random.uuid();
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.orderHelperMock.getOrderId.returns(statusUpdateId);
            stubs.paymentServiceMock.getOrder.returns({
                order: {}
            });

            var url = paymentService.processPaymentUpdate(this.order, statusUpdateId);

            expect(stubs.paymentHelperMock.processPaymentResult).have.to.been.calledOnce();
            expect(url).to.eql(this.processPaymentResultResult.url);
        });
        it('Should call processPaymentResult when payment id does match statusUpdateId', () => {
            const statusUpdateId = faker.random.uuid();
            stubs.orderHelperMock.isMollieOrder.returns(false);
            stubs.orderHelperMock.getOrderId.returns(faker.random.uuid());
            stubs.orderHelperMock.getPaymentId.returns(statusUpdateId);
            stubs.paymentServiceMock.getPayment.returns({
                payment: {}
            });

            var url = paymentService.processPaymentUpdate(this.order, statusUpdateId);

            expect(stubs.paymentHelperMock.processPaymentResult).have.to.been.calledOnce();
            expect(url).to.eql(this.processPaymentResultResult.url);
        });
        it('Should ignore processPaymentResult when order id or payment id does not match statusUpdateId', () => {
            const statusUpdateId = faker.random.uuid();
            stubs.orderHelperMock.isMollieOrder.returns(true);
            stubs.orderHelperMock.getOrderId.returns(faker.random.uuid());
            stubs.orderHelperMock.getPaymentId.returns(faker.random.uuid());
            stubs.paymentServiceMock.getOrder.returns({
                order: {}
            });

            var url = paymentService.processPaymentUpdate(this.order, statusUpdateId);

            expect(stubs.paymentHelperMock.processPaymentResult).not.to.have.been.called();
            expect(url).to.be.undefined();
        });
    });
    context('#cancelPayment', () => {
        it('Should call cancelPayment', () => {
            const paymentId = faker.random.uuid();

            paymentService.cancelPayment(paymentId);

            expect(stubs.mollieServiceMock.cancelPayment).have.to.been.calledOnce();
        });
    });
    context('#createOrder', () => {
        it('Should call createOrder', () => {
            const order = new stubs.dw.OrderMock();
            order.getCustomer.returns({ getProfile: () => { } });
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            const createOrderResult = {
                order: {
                    id: faker.random.uuid()
                }
            };
            stubs.mollieServiceMock.createOrder.returns(createOrderResult);

            var result = paymentService.createOrder(order, paymentMethod, {});

            expect(stubs.mollieServiceMock.createOrder).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.addItemToOrderHistory).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.setUsedTransactionAPI).have.to.been.calledOnce();
            expect(stubs.orderHelperMock.setOrderId).have.to.been.calledOnce();
            expect(result).to.eql(createOrderResult);
        });
    });
    context('#cancelOrder', () => {
        it('Should call cancelOrder', () => {
            const orderId = faker.random.uuid();

            paymentService.cancelOrder(orderId);

            expect(stubs.mollieServiceMock.cancelOrder).have.to.been.calledOnce();
        });
    });
    context('#cancelOrderLineItem', () => {
        it('Should call cancelOrderLineItem', () => {
            const order = new stubs.dw.OrderMock();

            paymentService.cancelOrderLineItem(order);

            expect(stubs.mollieServiceMock.cancelOrderLineItem).have.to.been.calledOnce();
        });
    });
    context('#getApplicablePaymentMethods', () => {
        it('Should get the applicable payment methods', () => {
            // TODO
        });
    });
    context('#createOrderRefund', () => {
        it('Should call createOrderRefund', () => {
            const order = new stubs.dw.OrderMock();

            paymentService.createOrderRefund(order);

            expect(stubs.mollieServiceMock.createOrderRefund).have.to.been.calledOnce();
        });
    });
    context('#createPaymentRefund', () => {
        it('Should call createPaymentRefund', () => {
            const paymentId = faker.random.uuid();
            const amount = faker.random.number().toString();

            paymentService.createPaymentRefund(paymentId, amount);

            expect(stubs.mollieServiceMock.createPaymentRefund).have.to.been.calledOnce();
        });
    });
    context('#createShipment', () => {
        it('Should call createShipment', () => {
            const order = new stubs.dw.OrderMock();

            paymentService.createShipment(order);

            expect(stubs.mollieServiceMock.createShipment).have.to.been.calledOnce();
        });
    });
    context('#createCustomer', () => {
        it('Should call createCustomer', () => {
            const profile = new stubs.dw.ProfileMock();

            paymentService.createCustomer(profile);

            expect(stubs.mollieServiceMock.createCustomer).have.to.been.calledOnce();
        });
    });
    context('#requestPaymentSession', () => {
        it('Should call requestPaymentSession', () => {
            const validationURL = faker.internet.url();

            paymentService.requestPaymentSession(validationURL);

            expect(stubs.mollieServiceMock.requestPaymentSession).have.to.been.calledOnce();
        });
    });
});
