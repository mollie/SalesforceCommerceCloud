const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const MollieServiceException = require('../../../cartridges/int_mollie/cartridge/scripts/exceptions/MollieServiceException');
const Resource = require('./dw/web/Resource');
const BasketMgr = require('./dw/order/BasketMgr');
const Basket = require('./dw/order/Basket');
const Order = require('./dw/order/Order');
const OrderAddress = require('./dw/order/OrderAddress');
const ProductLineItem = require('./dw/order/ProductLineItem');
const PaymentMgr = require('./dw/order/PaymentMgr');
const HookMgr = require('./dw/system/HookMgr');
const OrderMgr = require('./dw/order/OrderMgr');
const Profile = require('./dw/customer/Profile');
const PaymentInstrument = require('./dw/order/OrderPaymentInstrument');
const PaymentMethod = require('./dw/order/PaymentMethod');
const PaymentProcessor = require('./dw/order/PaymentProcessor');
const PaymentTransaction = require('./dw/order/PaymentTransaction');
const Currency = require('./dw/util/Currency');
const URLUtils = require('./dw/web/URLUtils');
const StringUtils = require('./dw/util/StringUtils');
const Calendar = require('./dw/util/Calendar');
const ISML = require('./dw/template/ISML');

const ServerMock = function () {
    this.routes = [];
    this.get = function () {
        const args = Array.prototype.slice.call(arguments);
        const name = args[0];
        const callback = args.pop();
        const middleware = args.slice(1);
        return this.routes.push({
            name: name,
            middleware: middleware,
            callback: callback
        });
    };
    this.post = function () {
        const args = Array.prototype.slice.call(arguments);
        const name = args[0];
        const callback = args.pop();
        const middleware = args.slice(1);
        return this.routes.push({
            name: name,
            middleware: middleware,
            callback: callback
        });
    };
    this.exports = () => {
        const exports = {};
        this.routes.forEach(i => { exports[i.name] = i.callback; });
        return exports;
    };
    this.middleware = {
        https: 'httpsMiddleware'
    };
    this.getMiddleware = function (routeName) {
        const route = this.routes.find(r => r.name === routeName);
        if (!route) return [];
        return route.middleware;
    };
    this.next = sandbox.stub();
    this.res = {
        redirect: sandbox.stub(),
        json: sandbox.stub(),
        setViewData: sandbox.stub(),
        render: sandbox.stub()
    };
};

class ResourceMock extends Resource {
    constructor() {
        super();
        return sandbox.createStubInstance(Resource);
    }
}

class OrderMock extends Order {
    constructor() {
        super();
        return sandbox.createStubInstance(Order);
    }
}

class BasketMock extends Basket {
    constructor() {
        super();
        return sandbox.createStubInstance(Basket);
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

const serviceExceptionMock = sandbox.spy(MollieServiceException);

const customMock = sandbox.stub();
const SiteMock = {
    getCurrent: () => ({
        getPreferences: () => ({
            getCustom: customMock
        }),
        getID: () => 'siteID',
        getName: () => 'siteName'
    })
};

const MollieMock = sandbox.stub();
const mollieMockInstance = {
    execute: sandbox.stub(),
    addPayloadBuilder: sandbox.stub(),
    addResponseMapper: sandbox.stub()
};
const mollieServiceMock = {
    createPayment: sandbox.stub(),
    getPayment: sandbox.stub(),
    cancelPayment: sandbox.stub(),
    createOrder: sandbox.stub(),
    getOrder: sandbox.stub(),
    cancelOrder: sandbox.stub(),
    cancelOrderLineItem: sandbox.stub(),
    createOrderRefund: sandbox.stub(),
    createPaymentRefund: sandbox.stub(),
    createShipment: sandbox.stub(),
    getMethod: sandbox.stub(),
    getMethods: sandbox.stub(),
    getMethodsWithParams: sandbox.stub(),
    createCustomer: sandbox.stub(),
    requestPaymentSession: sandbox.stub()
};

const dw = {
    OrderMgrMock: sandbox.stub(OrderMgr),
    URLUtilsMock: sandbox.stub(URLUtils),
    StringUtilsMock: sandbox.stub(StringUtils),
    PaymentMgrMock: sandbox.stub(PaymentMgr),
    BasketMgrMock: sandbox.stub(BasketMgr),
    ISMLMock: sandbox.stub(ISML),
    ResourceMock: ResourceMock,
    OrderMock: OrderMock,
    BasketMock: BasketMock,
    OrderAddressMock: OrderAddressMock,
    ProductLineItemMock: ProductLineItemMock,
    ProfileMock: ProfileMock,
    CurrencyMock: CurrencyMock,
    PaymentInstrumentMock: PaymentInstrumentMock,
    PaymentProcessorMock: PaymentProcessorMock,
    PaymentTransactionMock: PaymentTransactionMock,
    PaymentMethodMock: PaymentMethodMock,
    TransactionMock: {
        begin: sandbox.stub(),
        rollback: sandbox.stub(),
        commit: sandbox.stub(),
        wrap: sandbox.stub()
    },
    loggerMock: {
        getLogger: sandbox.stub()
    },
    localServiceRegistryMock: {
        createService: sandbox.stub()
    },
    statusMock: { isError: sandbox.stub(), message: 'errorMessage', getMessage: sandbox.stub(), items: [] },
    HookMgrMock: sandbox.stub(HookMgr),
    CalendarMock: sandbox.stub(),
    Site: SiteMock
};

const loggerMock = { debug: sandbox.stub(), error: sandbox.stub() };
const collectionsMock = { map: sandbox.stub() };

const configMock = {
    getSiteId: sandbox.stub(),
    getSiteName: sandbox.stub(),
    getEnabledMode: sandbox.stub(),
    getBearerToken: sandbox.stub(),
    getDefaultEnabledTransactionAPI: sandbox.stub(),
    getDefaultOrderExpiryDays: sandbox.stub(),
    getEnableSingleClickPayments: sandbox.stub(),
    getComponentsEnabled: sandbox.stub(),
    getProfileId: sandbox.stub(),
    getLogCategory: sandbox.stub(),
    getTransactionStatus: sandbox.stub(),
    getTransactionAPI: sandbox.stub(),
    getRefundStatus: sandbox.stub(),
    getDefaultAttributeValue: sandbox.stub()
};

const orderHelperMock = {
    getMappedPaymentDescription: sandbox.stub(),
    getOrderLineCategories: sandbox.stub(),
    checkMollieRefundStatus: sandbox.stub(),
    setRefundStatus: sandbox.stub(),
    getRefundStatus: sandbox.stub(),
    addItemToOrderHistory: sandbox.stub(),
    failOrder: sandbox.stub(),
    cancelOrder: sandbox.stub(),
    failOrCancelOrder: sandbox.stub(),
    undoFailOrder: sandbox.stub(),
    undoCancelOrder: sandbox.stub(),
    undoFailOrCancelOrder: sandbox.stub(),
    isMollieOrder: sandbox.stub(),
    setOrderPaymentStatus: sandbox.stub(),
    setOrderShippingStatus: sandbox.stub(),
    getMolliePaymentInstruments: sandbox.stub(),
    setTransactionCustomProperty: sandbox.stub(),
    getTransactionCustomProperty: sandbox.stub(),
    setOrderCustomProperty: sandbox.stub(),
    getOrderCustomProperty: sandbox.stub(),
    setPaymentId: sandbox.stub(),
    getPaymentId: sandbox.stub(),
    getIssuerData: sandbox.stub(),
    setIssuerData: sandbox.stub(),
    setPaymentDetails: sandbox.stub(),
    getPaymentDetails: sandbox.stub(),
    setPaymentStatus: sandbox.stub(),
    getPaymentStatus: sandbox.stub(),
    setPaymentDescription: sandbox.stub(),
    getPaymentDescription: sandbox.stub(),
    setOrderId: sandbox.stub(),
    getOrderId: sandbox.stub(),
    setOrderStatus: sandbox.stub(),
    getOrderStatus: sandbox.stub(),
    setUsedTransactionAPI: sandbox.stub(),
    getUsedTransactionAPI: sandbox.stub(),
    setOrderIsAuthorized: sandbox.stub(),
    getOrderIsAuthorized: sandbox.stub()
};

const checkoutHelpersMock = {
    placeOrder: sandbox.stub(),
    sendConfirmationEmail: sandbox.stub(),
    validateCreditCard: sandbox.stub(),
    payOrder: sandbox.stub()
};

const renderTemplateHelperMock = {
    getRenderedHtml: sandbox.stub(),
    renderTemplate: sandbox.stub()
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
    getMethods: sandbox.stub(),
    createOrderRefund: sandbox.stub(),
    createPaymentRefund: sandbox.stub(),
    createShipment: sandbox.stub(),
    createCustomer: sandbox.stub()
};

const paymentHelperMock = {
    processPaymentResult: sandbox.stub()
};

const mollieConfigHelperMock = {
    getPreference: sandbox.stub()
};

const mollieRequestEntitiesMock = {
    Currency: sandbox.stub(),
    Address: sandbox.stub(),
    ProductLineItem: sandbox.stub(),
    ShippingLineItem: sandbox.stub(),
    DiscountLineItem: sandbox.stub(),
    Lines: sandbox.stub()
};

const csrfProtectionMock = {
    generateToken: sandbox.stub(),
    validateRequest: sandbox.stub(),
    validateAjaxRequest: sandbox.stub()
};

/**
 * INITIALIZE ALL MOCKS
 */

const initMocks = function () {
    Object.keys(dw.URLUtilsMock).map(i => dw.URLUtilsMock[i].reset());
    Object.keys(dw.StringUtilsMock).map(i => dw.StringUtilsMock[i].reset());
    Object.keys(dw.OrderMgrMock).map(i => dw.OrderMgrMock[i].reset());
    Object.keys(loggerMock).map(i => loggerMock[i].reset());
    Object.keys(configMock).map(i => configMock[i].reset());
    Object.keys(dateMock).map(i => dateMock[i].reset());
    Object.keys(paymentServiceMock).map(i => paymentServiceMock[i].reset());
    Object.keys(paymentHelperMock).map(i => paymentHelperMock[i].reset());
    Object.keys(mollieConfigHelperMock).map(i => mollieConfigHelperMock[i].reset());
    Object.keys(orderHelperMock).map(i => orderHelperMock[i].reset());
    Object.keys(checkoutHelpersMock).map(i => checkoutHelpersMock[i].reset());
    Object.keys(renderTemplateHelperMock).map(i => renderTemplateHelperMock[i].reset());
    Object.keys(mollieRequestEntitiesMock).map(i => mollieRequestEntitiesMock[i].reset());
    Object.keys(csrfProtectionMock).map(i => csrfProtectionMock[i].reset());
    Object.keys(dw.ISMLMock).map(i => dw.ISMLMock[i].reset());
    Object.keys(dw.HookMgrMock).map(i => dw.HookMgrMock[i].reset());
    Object.keys(dw.CurrencyMock).map(i => dw.CurrencyMock[i].reset());
    Object.keys(dw.TransactionMock).map(i => dw.TransactionMock[i].reset());
    Object.keys(dw.PaymentInstrumentMock).map(i => dw.PaymentInstrumentMock[i].reset());
    Object.keys(dw.PaymentMethodMock).map(i => dw.PaymentMethodMock[i].reset());
    Object.keys(dw.PaymentProcessorMock).map(i => dw.PaymentProcessorMock[i].reset());
    Object.keys(dw.PaymentTransactionMock).map(i => dw.PaymentTransactionMock[i].reset());
    Object.keys(mollieMockInstance).map(i => mollieMockInstance[i].reset());
    Object.keys(mollieServiceMock).map(i => mollieServiceMock[i].reset());
    MollieMock.reset();
    dw.statusMock.isError.reset();
    dw.statusMock.getMessage.reset();
    serviceExceptionMock.resetHistory();

    // INITIALIZE
    serviceExceptionMock.from = sandbox.stub().callsFake(function (e) {
        return e;
    });
    MollieMock.returns(mollieMockInstance);
    dw.OrderMgrMock.failOrder.returns(dw.statusMock);
    dw.OrderMgrMock.cancelOrder.returns(dw.statusMock);
    dw.TransactionMock.wrap.callsFake(function (cb) {
        cb();
    });
    dw.localServiceRegistryMock.createService.callsFake(function () {
        return {
            createRequest: sandbox.stub,
            parseResponse: sandbox.stub
        };
    });
    dw.CalendarMock.returns(sandbox.createStubInstance(Calendar));
};

module.exports = {
    sandbox: sandbox,
    mollieRequest: sandbox.stub(),
    authRequest: sandbox.stub(),
    loggerMock: loggerMock,
    collectionsMock: collectionsMock,
    configMock: configMock,
    dateMock: dateMock,
    paymentServiceMock: paymentServiceMock,
    paymentHelperMock: paymentHelperMock,
    mollieConfigHelperMock: mollieConfigHelperMock,
    orderHelperMock: orderHelperMock,
    checkoutHelpersMock: checkoutHelpersMock,
    serviceExceptionMock: serviceExceptionMock,
    renderTemplateHelperMock: renderTemplateHelperMock,
    mollieRequestEntitiesMock: mollieRequestEntitiesMock,
    csrfProtectionMock: csrfProtectionMock,
    MollieMock: MollieMock,
    mollieMockInstance: mollieMockInstance,
    mollieServiceMock: mollieServiceMock,
    mollieHandlerStub: {
        payloadBuilder: sandbox.stub(),
        responseMapper: sandbox.stub()
    },
    dw: dw,
    superModule: () => {
        return sandbox.stub();
    },
    reset: initMocks,
    init: () => {
        sandbox.restore();
        initMocks();
    },
    restore: function () { sandbox.restore(); },
    serverMock: new ServerMock()
};
