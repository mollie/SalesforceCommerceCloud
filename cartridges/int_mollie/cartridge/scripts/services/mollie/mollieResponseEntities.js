var config = require('*/cartridge/scripts/mollieConfig');

/**
 *
 * @class
 * @param {Object} amount - Mollie Amount object
 */
function Amount(amount) {
    amount = amount || {};
    this.value = amount.value;
    this.currency = amount.currency;
}

/**
 *
 * @class
 * @param {Object} link - Mollie Link object
 */
function Link(link) {
    link = link || {};
    this.href = link.href;
    this.type = link.type;
}

/**
 *
 * @class
 * @param {Object} links - Mollie Links object
 */
function Links(links) {
    links = links || {};
    this.self = new Link(links.self);
    this.checkout = new Link(links.checkout);
    this.documentation = new Link(links.documentation);
}

/**
 *
 * @class
 * @param {Object} address - Mollie Address object
 */
function Address(address) {
    address = address || {};
    this.organizationName = address.organizationName;
    this.streetAndNumber = address.streetAndNumber;
    this.streetAdditional = address.streetAdditional;
    this.city = address.city;
    this.region = address.region;
    this.postalCode = address.postalCode;
    this.country = address.country;
    this.title = address.title;
    this.givenName = address.givenName;
    this.familyName = address.familyName;
    this.email = address.email;
}

/**
 *
 * @class
 * @param {Object} payment - Mollie Payment object
 */
function Payment(payment) {
    payment = payment || {};
    this.resource = payment.resource;
    this.id = payment.id;
    this.mode = payment.mode;
    this.createdAt = payment.createdAt;
    this.amount = new Amount(payment.amount);
    this.description = payment.description;
    this.method = payment.method;
    this.metadata = payment.metadata;
    this.status = payment.status;
    this.isCancelable = function () {
        return payment.isCancelable;
    };
    this.isShippable = function () {
        return false;
    };
    this.isRefundable = function () {
        return payment.amountRemaining
            && parseFloat(payment.amountRemaining.value) > 0;
    };
    this.expiresAt = payment.expiresAt;
    this.details = payment.details;
    this.profileId = payment.profileId;
    this.sequenceType = payment.sequenceType;
    this.redirectUrl = payment.redirectUrl;
    this.webhookUrl = payment.webhookUrl;
    this.links = new Links(payment._links);
}

/**
 *
 * @class
 * @param {Object} order - Mollie Order object
 */
function Order(order) {
    const STATUS = config.getTransactionStatus();
    order = order || {};
    this.resource = order.resource;
    this.id = order.id;
    this.profileId = order.profileId;
    this.method = order.method;
    this.amount = new Amount(order.amount);
    this.status = order.status;
    this.isCancelable = function () {
        return order.isCancelable;
    };
    this.isShippable = function () {
        return order.status === STATUS.PAID ||
            order.status === STATUS.AUTHORIZED ||
            order.status === STATUS.SHIPPING
    };
    this.isRefundable = function () {
        return (order.status === STATUS.PAID ||
            order.status === STATUS.SHIPPING ||
            order.status === STATUS.COMPLETED)
            && order.amountRefunded.value !== order.amount.value
    };
    this.metadata = order.metadata;
    this.createdAt = order.createdAt;
    this.expiresAt = order.expiresAt;
    this.mode = order.mode;
    this.locale = order.locale;
    this.billingAddress = new Address(order.billingAddress);
    this.shopperCountryMustMatchBillingCountry = order.shopperCountryMustMatchBillingCountry;
    this.consumerDateOfBirth = order.consumerDateOfBirth;
    this.orderNumber = order.orderNumber;
    this.amountRefunded = new Amount(order.amountRefunded);
    this.shippingAddress = new Address(order.shippingAddress);
    this.redirectUrl = order.redirectUrl;
    this.lines = order.lines ? order.lines.map(function (line) {
        return new Line(line);
    }) : null;
    this.links = new Links(order._links);
    this.payments = order._embedded && order._embedded.payments ?
        order._embedded.payments.map(function (payment) {
            return new Payment(payment);
        }) : null;
}

/**
 *
 * @class
 * @param {Object} method - Mollie Method object
 */
function Method(method) {
    method = method || {};
    this.resource = method.resource;
    this.id = method.id;
    this.description = method.description;
    this.minimumAmount = new Amount(method.minimumAmount);
    this.maximumAmount = new Amount(method.maximumAmount);
    this.imageURL = method.image && method.image.svg;
    this.issuers = method.issuers && method.issuers.map(function (issuer) {
        return new Issuer(issuer);
    });
}

/**
 *
 * @class
 * @param {Object} refund - Mollie Refund object
 */
function Refund(refund) {
    refund = refund || {};
    this.resource = refund.resource;
    this.id = refund.id;
    this.amount = new Amount(refund.amount);
    this.createdAt = refund.createdAt;
    this.description = refund.description;
    this.paymentId = refund.paymentId;
    this.orderId = refund.orderId;
    this.lines = refund.lines ? refund.lines.map(function (line) {
        return new Line(line);
    }) : null;
    this.isSuccessful = function () {
        return refund.status === "pending";
    };
}

/**
 *
 * @class
 * @param {Object} shipment - Mollie Shipment object
 */
function Shipment(shipment) {
    shipment = shipment || {};
    this.resource = shipment.resource;
    this.id = shipment.id;
    this.orderId = shipment.orderId;
    this.lines = shipment.lines ? shipment.lines.map(function (line) {
        return new Line(line);
    }) : null;
}

/**
 *
 * @class
 * @param {Object} line - Mollie Line object
 */
function Line(line) {
    line = line || {};
    this.resource = line.resource;
    this.id = line.id;
    this.orderId = line.orderId;
    this.name = line.name;
    this.sku = line.sku;
    this.type = line.type;
    this.status = line.status;
    this.metadata = line.metadata;
    this.isCancelable = line.isCancelable;
    this.quantity = line.quantity;
    this.unitPrice = new Amount(line.unitPrice);
    this.vatRate = line.vatRate;
    this.vatAmount = new Amount(line.vatAmount);
    this.discountAmount = new Amount(line.discountAmount);
    this.totalAmount = new Amount(line.totalAmount);
    this.createdAt = line.createdAt;
    this.quantityShipped = line.quantityShipped;
    this.amountShipped = new Amount(line.amountShipped);
    this.quantityRefunded = line.quantityRefunded;
    this.amountRefunded = new Amount(line.amountRefunded);
    this.quantityCanceled = line.quantityCanceled;
    this.amountCanceled = new Amount(line.amountCanceled);
    this.shippableQuantity = line.shippableQuantity;
    this.refundableQuantity = line.refundableQuantity;
    this.cancelableQuantity = line.cancelableQuantity;
}

/**
 *
 * @class
 * @param {Object} issuer - Mollie Issuer object
 */
function Issuer(issuer) {
    issuer = issuer || {};
    this.resource = issuer.resource;
    this.id = issuer.id;
    this.name = issuer.name;
    this.image = issuer.image && issuer.image.svg;
}

/**
 *
 * @class
 * @param {Object} customer - Mollie Customer object
 */
function Customer(customer) {
    customer = customer || {};
    this.resource = customer.resource;
    this.id = customer.id;
    this.name = customer.name;
    this.email = customer.email;
    this.locale = customer.locale;
    this.createdDatetime = customer.createdDatetime;
}

module.exports = {
    Amount: Amount,
    Link: Link,
    Links: Links,
    Address: Address,
    Payment: Payment,
    Order: Order,
    Method: Method,
    Refund: Refund,
    Shipment: Shipment,
    Line: Line,
    Issuer: Issuer,
    Customer: Customer
}
