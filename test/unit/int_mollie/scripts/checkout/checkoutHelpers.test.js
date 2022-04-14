const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const checkoutHelpers = proxyquire(`${base}/int_mollie/cartridge/scripts/checkout/checkoutHelpers`, {
    'dw/system/HookMgr': stubs.dw.HookMgrMock,
    'dw/order/PaymentMgr': stubs.dw.PaymentMgrMock,
    'dw/order/BasketMgr': stubs.dw.BasketMgrMock,
    'dw/order/OrderMgr': stubs.dw.OrderMgrMock,
    'dw/web/URLUtils': stubs.dw.URLUtilsMock,
    'dw/system/Transaction': stubs.dw.TransactionMock,
    'dw/order/Order': stubs.dw.OrderMock,
    'dw/web/Resource': stubs.dw.ResourceMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock,
    '*/cartridge/scripts/renderTemplateHelper': stubs.renderTemplateHelperMock,
    '*/cartridge/scripts/order/orderHelper': stubs.orderHelperMock,
    '*/cartridge/scripts/exceptions/MollieServiceException': stubs.serviceExceptionMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/utils/superModule': stubs.superModule,
    '*/cartridge/scripts/payment/paymentService': stubs.paymentServiceMock
});

const makeCollection = array => ({
    toArray: () => array,
    length: array.length
});

describe('checkout/checkoutHelpers', () => {
    before(() => stubs.init());
    afterEach(() => stubs.reset());
    after(() => stubs.restore());

    context('#handlePayments', () => {
        it('correctly calls authorize hook and returns redirectUrl', () => {
            const continueUrl = faker.internet.url();
            const order = new stubs.dw.OrderMock();

            const paymentProcessorID = `MOLLIE_${faker.lorem.word()}`;
            const paymentMethodID = faker.lorem.word();
            const paymentTransaction = new stubs.dw.PaymentTransactionMock();
            const paymentProcessor = new stubs.dw.PaymentProcessorMock();
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();

            paymentInstrument.getPaymentMethod.returns(paymentMethodID);
            paymentInstrument.getPaymentTransaction.returns(paymentTransaction);
            paymentMethod.getPaymentProcessor.returns(paymentProcessor);
            paymentProcessor.getID.returns(paymentProcessorID);

            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.returns(makeCollection([paymentInstrument]));
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([paymentInstrument]);

            stubs.dw.URLUtilsMock.url.returns(continueUrl);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
            stubs.dw.HookMgrMock.callHook.returns({
                continueUrl: continueUrl,
                fieldErrors: {},
                serverErrors: [],
                error: false
            });
            stubs.dw.HookMgrMock.hasHook.returns(true);

            var result = checkoutHelpers.handlePayments(order, order.orderNo);

            expect(result).to.eql({
                continueUrl: continueUrl,
                fieldErrors: {},
                serverErrors: [],
                error: false
            });

            expect(stubs.dw.HookMgrMock.callHook).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(
                    `app.payment.processor.${paymentProcessorID}`.toLowerCase(),
                    'Authorize',
                    order,
                    paymentInstrument,
                    paymentProcessor);

            expect(stubs.dw.OrderMgrMock.failOrder).not.to.have.been.called();
        });

        it('returns { error: true } when basketPrice is 0', () => {
            const order = new stubs.dw.OrderMock();
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => 0 };

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true,
                fieldErrors: [],
                serverErrors: [
                    ''
                ]
            });
            expect(stubs.dw.HookMgrMock.callHook).not.to.have.been.called();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.called();
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce();
        });

        it('returns { error: true } when no paymentProcessor exists', () => {
            const order = new stubs.dw.OrderMock();
            const continueUrl = faker.internet.url();
            const paymentMethodID = faker.lorem.word();
            const paymentTransaction = new stubs.dw.PaymentTransactionMock();
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            paymentInstrument.getPaymentMethod.returns(paymentMethodID);
            paymentInstrument.getPaymentTransaction.returns(paymentTransaction);
            paymentMethod.getPaymentProcessor.returns(null);
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.returns(makeCollection([paymentInstrument]));
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
            stubs.dw.URLUtilsMock.url.returns(continueUrl);

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true,
                fieldErrors: [],
                serverErrors: [
                    ''
                ]
            });
            expect(stubs.dw.HookMgrMock.callHook).not.to.have.been.called();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.called();
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce();
        });

        it('returns { error: true } when no payment instruments exist', () => {
            const order = new stubs.dw.OrderMock();
            const continueUrl = faker.internet.url();
            const paymentTransaction = new stubs.dw.PaymentTransactionMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            paymentMethod.getPaymentProcessor.returns(null);
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.returns(makeCollection([]));
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
            stubs.dw.URLUtilsMock.url.returns(continueUrl);

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true,
                fieldErrors: [],
                serverErrors: [
                    ''
                ]
            });
            expect(stubs.dw.HookMgrMock.callHook).not.to.have.been.called();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, true);
            expect(paymentTransaction.setTransactionID).not.to.have.been.called();
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce();
        });

        it('returns { error: true } when paymentProcessor has no custom authorizer', () => {
            const order = new stubs.dw.OrderMock();
            const continueUrl = faker.internet.url();
            const paymentMethodID = faker.lorem.word();
            const paymentTransaction = new stubs.dw.PaymentTransactionMock();
            const paymentProcessorID = `MOLLIE_${faker.lorem.word()}`;
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            const paymentProcessor = new stubs.dw.PaymentProcessorMock();
            paymentProcessor.getID.returns(paymentProcessorID);
            paymentInstrument.getPaymentMethod.returns(paymentMethodID);
            paymentInstrument.getPaymentTransaction.returns(paymentTransaction);
            paymentMethod.getPaymentProcessor.returns(paymentProcessor);
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.returns(makeCollection([paymentInstrument]));
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
            stubs.dw.HookMgrMock.callHook.returns({ error: true });
            stubs.dw.HookMgrMock.hasHook.returns(false);
            stubs.dw.URLUtilsMock.url.returns(continueUrl);

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true,
                fieldErrors: [],
                serverErrors: [
                    ''
                ]
            });

            expect(stubs.dw.HookMgrMock.callHook).not.to.have.been.called();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, true);
            expect(paymentTransaction.setTransactionID).not.to.have.been.called();
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce();
        });

        it('returns { error: true } and fails order when more than one Mollie payment instrument exists', () => {
            const order = new stubs.dw.OrderMock();
            const continueUrl = faker.internet.url();
            const paymentMethodID = faker.lorem.word();
            const paymentTransaction = new stubs.dw.PaymentTransactionMock();
            const paymentProcessorID = `MOLLIE_${faker.lorem.word()}`;
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            const paymentProcessor = new stubs.dw.PaymentProcessorMock();
            paymentProcessor.getID.returns(paymentProcessorID);
            paymentInstrument.getPaymentMethod.returns(paymentMethodID);
            paymentInstrument.getPaymentTransaction.returns(paymentTransaction);
            paymentMethod.getPaymentProcessor.returns(paymentProcessor);
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.returns(makeCollection([paymentInstrument, paymentInstrument]));
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([paymentInstrument, paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
            stubs.dw.HookMgrMock.hasHook.returns(true);
            stubs.dw.URLUtilsMock.url.returns(continueUrl);

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true,
                fieldErrors: [],
                serverErrors: [
                    ''
                ]
            });

            expect(stubs.dw.HookMgrMock.callHook).not.to.have.been.called();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.called();
            expect(paymentTransaction.setTransactionID).not.to.have.been.called();
        });

        it('fails an order and return { error: true } when authorization hook fails', () => {
            const order = new stubs.dw.OrderMock();
            const continueUrl = faker.internet.url();
            const paymentMethodID = faker.lorem.word();
            const paymentTransaction = new stubs.dw.PaymentTransactionMock();
            const paymentProcessorID = `MOLLIE_${faker.lorem.word()}`;
            const paymentInstrument = new stubs.dw.PaymentInstrumentMock();
            const paymentMethod = new stubs.dw.PaymentMethodMock();
            const paymentProcessor = new stubs.dw.PaymentProcessorMock();
            paymentProcessor.getID.returns(paymentProcessorID);
            paymentInstrument.getPaymentMethod.returns(paymentMethodID);
            paymentInstrument.getPaymentTransaction.returns(paymentTransaction);
            paymentMethod.getPaymentProcessor.returns(paymentProcessor);
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.returns(makeCollection([paymentInstrument]));
            stubs.orderHelperMock.getMolliePaymentInstruments.returns([paymentInstrument]);
            stubs.dw.PaymentMgrMock.getPaymentMethod.returns(paymentMethod);
            stubs.dw.HookMgrMock.callHook.returns({ error: true });
            stubs.dw.HookMgrMock.hasHook.returns(true);
            stubs.dw.URLUtilsMock.url.returns(continueUrl);

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true
            });
            expect(stubs.dw.HookMgrMock.callHook).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(
                    `app.payment.processor.${paymentProcessorID.toLowerCase()}`,
                    'Authorize',
                    order,
                    paymentInstrument,
                    paymentProcessor);
            expect(stubs.dw.OrderMgrMock.failOrder).to.not.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, true);
            expect(paymentTransaction.setTransactionID).not.to.have.been.called();
        });

        // ADD TEST TO

        it('fails an order and returns { error } when error is not of type MollieServiceException', () => {
            const order = new stubs.dw.OrderMock();
            order.orderNo = faker.random.number();
            order.totalNetPrice = { getValue: () => faker.random.number() };
            order.getPaymentInstruments.throws(new Error('BOOM'));

            expect(checkoutHelpers.handlePayments(order, order.orderNo)).to.eql({
                error: true,
                fieldErrors: [],
                serverErrors: [
                    ''
                ]
            });
            expect(stubs.dw.HookMgrMock.callHook).not.to.have.been.called();
            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(order, true);
        });
    });

    context('#orderExists', () => {
        it('return true if the order manager returns an existing order', () => {
            var orderNumber = faker.random.number();
            var orderToken = faker.random.number();
            var order = new stubs.dw.OrderMock();

            stubs.dw.OrderMgrMock.getOrder.returns(order);

            var result = checkoutHelpers.orderExists(orderNumber, orderToken);

            expect(stubs.dw.OrderMgrMock.getOrder).to.be.calledOnce()
                .and.to.be.calledWithExactly(orderNumber, orderToken);
            expect(result).to.be.eql(true);
        });
        it('return false is the order manager does not return an order', () => {
            var orderNumber = faker.random.number();
            var orderToken = faker.random.number();

            stubs.dw.OrderMgrMock.getOrder.returns(null);

            var result = checkoutHelpers.orderExists(orderNumber, orderToken);

            expect(stubs.dw.OrderMgrMock.getOrder).to.be.calledOnce()
                .and.to.be.calledWithExactly(orderNumber, orderToken);
            expect(result).to.be.eql(false);
        });
    });

    context('#restorePreviousBasket', () => {
        it('fail the last order when the status is CREATED. Continue with current basket', () => {
            var lastOrderNumber = faker.random.number();
            var lastOrderToken = faker.random.number();
            var order = new stubs.dw.OrderMock();

            order.getStatus.returns({ value: stubs.dw.OrderMock.ORDER_STATUS_CREATED });
            stubs.dw.BasketMgrMock.getCurrentBasket.returns({ getProductLineItems: () => [] });
            stubs.dw.OrderMgrMock.getOrder.returns(order);

            checkoutHelpers.restorePreviousBasket(lastOrderNumber, lastOrderToken);

            expect(stubs.orderHelperMock.failOrder).to.be.calledOnce()
                .and.to.be.calledWith(order, sinon.match('Order failed'));
            expect(stubs.dw.TransactionMock.wrap).to.be.calledOnce();
        });

        it('do nothing when the basket does not exist', () => {
            var lastOrderNumber = faker.random.number();

            stubs.dw.BasketMgrMock.getCurrentBasket.returns(null);

            checkoutHelpers.restorePreviousBasket(lastOrderNumber);

            expect(stubs.dw.OrderMgrMock.failOrder).not.to.have.been.called();
            expect(stubs.dw.TransactionMock.wrap).not.to.have.been.called();
        });


        it('do nothing when the last order has an other status than CREATED', () => {
            var lastOrderNumber = faker.random.number();
            var order = new stubs.dw.OrderMock();

            order.getStatus.returns({ value: stubs.dw.OrderMock.ORDER_STATUS_OPEN });
            stubs.dw.BasketMgrMock.getCurrentBasket.returns({ getProductLineItems: () => [] });
            stubs.dw.OrderMgrMock.getOrder.returns(order);

            checkoutHelpers.restorePreviousBasket(lastOrderNumber);

            expect(stubs.dw.OrderMgrMock.failOrder).not.to.have.been.called();
            expect(stubs.dw.TransactionMock.wrap).not.to.have.been.called();
        });

        it('do nothing when the current basket has line items', () => {
            var lastOrderNumber = faker.random.number();
            var order = new stubs.dw.OrderMock();

            order.getStatus.returns({
                value: stubs.dw.OrderMock.ORDER_STATUS_OPEN
            });
            stubs.dw.BasketMgrMock.getCurrentBasket.returns({ getProductLineItems: () => [1, 2, 3] });
            stubs.dw.OrderMgrMock.getOrder.returns(order);

            checkoutHelpers.restorePreviousBasket(lastOrderNumber);

            expect(stubs.dw.OrderMgrMock.failOrder).not.to.have.been.called();
            expect(stubs.dw.TransactionMock.wrap).not.to.have.been.called();
        });
    });

    context('#placeOrder', () => {
        it('places an order', () => {
            const order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.placeOrder.returns({ isError: () => false });
            stubs.dw.OrderMgrMock.undoFailOrder.returns({ isError: () => false });
            order.getStatus.returns({ value: stubs.dw.OrderMock.ORDER_STATUS_CREATED });

            checkoutHelpers.placeOrder(order);

            expect(order.setConfirmationStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWith(stubs.dw.OrderMock.CONFIRMATION_STATUS_CONFIRMED);
            expect(order.setExportStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWith(stubs.dw.OrderMock.EXPORT_STATUS_READY);
            expect(stubs.dw.TransactionMock.begin).to.have.been.calledOnce();
            expect(stubs.dw.TransactionMock.commit).to.have.been.calledOnce();
        });

        it('fails an order when placing an order fails and throws an error', () => {
            const order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.placeOrder.returns({ isError: () => true, message: 'BOOM' });
            stubs.dw.OrderMgrMock.undoFailOrder.returns({ isError: () => false });
            order.getStatus.returns({ value: stubs.dw.OrderMock.ORDER_STATUS_CREATED });

            expect(() => checkoutHelpers.placeOrder(order)).to.throw();

            expect(order.setConfirmationStatus).not.to.have.been.called();
            expect(order.setExportStatus).not.to.have.been.called();

            expect(stubs.dw.OrderMgrMock.failOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWith(order, true);
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('BOOM'));
            expect(stubs.dw.TransactionMock.begin).to.have.been.calledOnce();
            expect(stubs.dw.TransactionMock.commit).to.have.been.calledOnce();
        });

        it('undo a failed order and place the order after', () => {
            const order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.placeOrder.returns({ isError: () => false });
            stubs.dw.OrderMgrMock.undoFailOrder.returns({ isError: () => false });
            order.getStatus.returns({ value: stubs.dw.OrderMock.ORDER_STATUS_FAILED });

            checkoutHelpers.placeOrder(order);

            expect(order.setConfirmationStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWith(stubs.dw.OrderMock.CONFIRMATION_STATUS_CONFIRMED);
            expect(order.setExportStatus).to.have.been.calledOnce()
                .and.to.have.been.calledWith(stubs.dw.OrderMock.EXPORT_STATUS_READY);
            expect(order.getStatus).to.have.been.calledOnce();
            expect(stubs.dw.TransactionMock.begin).to.have.been.calledTwice();
            expect(stubs.dw.TransactionMock.commit).to.have.been.calledTwice();
        });

        it('fails an order when undoing a failed order fails and throws an error', () => {
            const order = new stubs.dw.OrderMock();
            stubs.dw.OrderMgrMock.placeOrder.returns({ isError: () => false });
            stubs.dw.OrderMgrMock.undoFailOrder.returns({ isError: () => true, message: 'BOOM' });
            order.getStatus.returns({ value: stubs.dw.OrderMock.ORDER_STATUS_FAILED });

            expect(() => checkoutHelpers.placeOrder(order)).to.throw();

            expect(order.setConfirmationStatus).not.to.have.been.called();
            expect(order.setExportStatus).not.to.have.been.called();

            expect(stubs.dw.OrderMgrMock.undoFailOrder).to.have.been.calledOnce()
                .and.to.have.been.calledWith(order);
            expect(stubs.serviceExceptionMock).to.have.been.calledOnce()
                .and.to.have.been.calledWith(sinon.match('BOOM'));
            expect(order.getStatus).to.have.been.calledOnce();
            expect(stubs.dw.TransactionMock.begin).to.have.been.calledOnce();
            expect(stubs.dw.TransactionMock.commit).to.have.been.calledOnce();
        });
    });

    context('#getMolliePaymentMethods', () => {
        const molliePaymentMethodId = faker.random.uuid();
        const molliePaymentMethodImageURL = faker.random.uuid();
        const currentBasket = new stubs.dw.BasketMock();
        const countryCode = faker.lorem.word();

        const orderModel = {
            billing: {
                payment: {
                    applicablePaymentMethods: [
                        {
                            ID: faker.random.word(),
                            name: faker.random.word()
                        },
                        {
                            ID: faker.random.word(),
                            name: faker.random.word(),
                            molliePaymentMethodId: molliePaymentMethodId
                        },
                        {
                            ID: faker.random.word(),
                            name: faker.random.word(),
                            molliePaymentMethodId: faker.random.uuid()
                        }
                    ]
                }
            }
        };

        const issuers = [
            {
                id: faker.random.uuid()
            }
        ];

        const molliePaymentMethods = [
            {
                id: molliePaymentMethodId,
                issuers: issuers,
                imageURL: molliePaymentMethodImageURL
            }
        ];

        it('returns the mapped Mollie payment methods', () => {
            stubs.paymentServiceMock.getMethods.returns({ methods: molliePaymentMethods });
            var paymentMethods = checkoutHelpers.getMolliePaymentMethods(currentBasket, orderModel, countryCode);

            expect(paymentMethods).to.have.length(2);
            expect(paymentMethods[1].issuers).to.eql(issuers);
            expect(paymentMethods[1].image).to.eql(molliePaymentMethodImageURL);
        });
    });
});
