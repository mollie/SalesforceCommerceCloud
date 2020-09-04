const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const Order = require('./dw/order/Order');
const OrderAddress = require('./dw/order/OrderAddress');
const ProductLineItem = require('./dw/order/ProductLineItem');
const PaymentMgr = require('./dw/order/PaymentMgr');
const OrderMgr = require('./dw/order/OrderMgr');
const Profile = require('./dw/customer/Profile');
const PaymentInstrument = require('./dw/order/OrderPaymentInstrument');
const PaymentMethod = require('./dw/order/PaymentMethod');
const PaymentProcessor = require('./dw/order/PaymentProcessor');
const PaymentTransaction = require('./dw/order/PaymentTransaction');
const Currency = require('./dw/util/Currency');
const URLUtils = require('./dw/web/URLUtils');

class OrderMock extends Order {
    constructor() {
        super();
        return sandbox.createStubInstance(Order);
    }
}

class OrderAddressMock extends OrderAddress {
    constructor() {
        super();
        return sandbox.createStubInstance(OrderAddress);
    }
}

class ProductLineItemMock extends ProductLineItem {
    constructor() {
        super();
        return sandbox.createStubInstance(ProductLineItem);
    }
}

class ProfileMock extends Profile {
    constructor() {
        super();
        return sandbox.createStubInstance(Profile);
    }
}

class PaymentInstrumentMock extends PaymentInstrument {
    constructor() {
        super();
        return sandbox.createStubInstance(PaymentInstrument);
    }
}

class PaymentMethodMock extends PaymentMethod {
    constructor() {
        super();
        return sandbox.createStubInstance(PaymentMethod);
    }
}

class PaymentProcessorMock extends PaymentProcessor {
    constructor() {
        super();
        return sandbox.createStubInstance(PaymentProcessor);
    }
}

class PaymentTransactionMock extends PaymentTransaction {
    constructor() {
        super();
        return sandbox.createStubInstance(PaymentTransaction);
    }
}

class CurrencyMock extends Currency {
    constructor() {
        super();
        return sandbox.createStubInstance(Currency);
    }
}

const MollieMock = sandbox.stub();
const mollieMockInstance = {
    execute: sandbox.stub(),
    addPayloadBuilder: sandbox.stub(),
    addResponseMapper: sandbox.stub()
};

const dw = {
    OrderMgrMock: sandbox.stub(OrderMgr),
    URLUtilsMock: sandbox.stub(URLUtils),
    PaymentMgrMock: sandbox.stub(PaymentMgr),
    OrderMock: OrderMock,
    OrderAddressMock: OrderAddressMock,
    ProductLineItemMock: ProductLineItemMock,
    ProfileMock: ProfileMock,
    CurrencyMock: CurrencyMock,
    PaymentInstrumentMock: PaymentInstrumentMock,
    PaymentProcessorMock: PaymentProcessorMock,
    PaymentTransactionMock: PaymentTransactionMock,
    PaymentMethodMock: PaymentMethodMock,
    statusMock: { isError: sandbox.stub(), message: 'errorMessage', getMessage: sandbox.stub(), items: [] },
};

const loggerMock = { debug: sandbox.stub(), error: sandbox.stub() };

const configMock = {
    getSiteId: sandbox.stub(),
    getBearerToken: sandbox.stub(),
    getTransactionStatus: sandbox.stub(),
    getEnabledTransactionAPI: sandbox.stub(),
    getOrderDefaultExpiryDays: sandbox.stub(),
    getLogCategory: sandbox.stub(),
    getComponentsEnabled: sandbox.stub(),
    getComponentsEnableTestMode: sandbox.stub(),
    getComponentsProfileId: sandbox.stub(),
    getEnableSingleClickPayments: sandbox.stub(),
    getTransactionAPI: sandbox.stub()
};

const dateMock = {
    addDays: sandbox.stub(),
    addHours: sandbox.stub(),
    now: sandbox.stub(),
    format: sandbox.stub()
};

const paymentServiceMock = {
    getPayment: sandbox.stub(),
    createPayment: sandbox.stub(),
    processPaymentUpdate: sandbox.stub(),
    cancelPayment: sandbox.stub(),
    getOrder: sandbox.stub(),
    createOrder: sandbox.stub(),
    cancelOrder: sandbox.stub(),
    cancelOrderLineItem: sandbox.stub(),
    getApplicablePaymentMethods: sandbox.stub(),
    createOrderRefund: sandbox.stub(),
    createPaymentRefund: sandbox.stub(),
    createShipment: sandbox.stub(),
    createCustomer: sandbox.stub()
};

/**
 * INITIALIZE ALL MOCKS
 */

const initMocks = function () {
    Object.keys(dw.URLUtilsMock).map(i => dw.URLUtilsMock[i].reset());
    Object.keys(dw.OrderMgrMock).map(i => dw.OrderMgrMock[i].reset());
    Object.keys(loggerMock).map(i => loggerMock[i].reset());
    Object.keys(configMock).map(i => configMock[i].reset());
    Object.keys(dateMock).map(i => dateMock[i].reset());
    Object.keys(paymentServiceMock).map(i => paymentServiceMock[i].reset());    
    Object.keys(dw.CurrencyMock).map(i => dw.CurrencyMock[i].reset());
    Object.keys(dw.PaymentInstrumentMock).map(i => dw.PaymentInstrumentMock[i].reset());
    Object.keys(dw.PaymentMethodMock).map(i => dw.PaymentMethodMock[i].reset());
    Object.keys(dw.PaymentProcessorMock).map(i => dw.PaymentProcessorMock[i].reset());
    Object.keys(dw.PaymentTransactionMock).map(i => dw.PaymentTransactionMock[i].reset());
    Object.keys(mollieMockInstance).map(i => mollieMockInstance[i].reset());
    MollieMock.reset();
    dw.statusMock.isError.reset();
    dw.statusMock.getMessage.reset();
    MollieMock.returns(mollieMockInstance);
    dw.OrderMgrMock.failOrder.returns(dw.statusMock);
    dw.OrderMgrMock.cancelOrder.returns(dw.statusMock);
}

module.exports = {
    sandbox: sandbox,
    mollieRequest: sandbox.stub(),
    authRequest: sandbox.stub(),
    loggerMock: loggerMock,
    configMock: configMock,
    dateMock: dateMock,
    paymentServiceMock: paymentServiceMock,
    MollieMock: MollieMock,
    mollieMockInstance: mollieMockInstance,
    mollieHandlerStub: {
        payloadBuilder: sandbox.stub(),
        responseMapper: sandbox.stub()
    },
    dw: dw,
    superModule: () => {
        return sandbox.stub()
    },
    reset: initMocks,
    init: () => {
        sandbox.restore();
        initMocks();
    },
    restore: function () { sandbox.restore(); }
};
