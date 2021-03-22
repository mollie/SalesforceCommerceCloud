/* eslint-disable no-underscore-dangle */

var config = require('*/cartridge/scripts/mollieConfig');

/**
 *
 * @class
 * @param {Object} mollieAmount - Mollie Amount object
 */
function Amount(mollieAmount) {
    var amount = mollieAmount || {};
    this.value = amount.value;
    this.currency = amount.currency;
}

/**
 *
 * @class
 * @param {Object} mollieLink - Mollie Link object
 */
function Link(mollieLink) {
    var link = mollieLink || {};
    this.href = link.href;
    this.type = link.type;
}

/**
 *
 * @class
 * @param {Object} mollieLinks - Mollie Links object
 */
function Links(mollieLinks) {
    var links = mollieLinks || {};
    this.self = new Link(links.self);
    this.checkout = new Link(links.checkout);
    this.documentation = new Link(links.documentation);
}

/**
 *
 * @class
 * @param {Object} mollieAddress - Mollie Address object
 */
function Address(mollieAddress) {
    var address = mollieAddress || {};
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
 * @param {Object} molliePayment - Mollie Payment object
 */
function Payment(molliePayment) {
    var payment = molliePayment || {};
    this.resource = payment.resource;
    this.id = payment.id;
    this.mode = payment.mode;
    this.createdAt = payment.createdAt;
    this.amount = new Amount(payment.amount);
    this.description = payment.description;
    this.method = payment.method;
    this.metadata = payment.metadata;
    this.locale = payment.locale;
    this.status = payment.status;
    this.amountRefunded = payment.amountRefunded;
    this.amountRemaining = payment.amountRemaining;
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
 * @param {Object} mollieLine - Mollie Line object
 */
function Line(mollieLine) {
    var line = mollieLine || {};
    this.resource = line.resource;
    this.id = line.id;
    this.orderId = line.orderId;
    this.name = line.name;
    this.sku = line.sku;
    this.type = line.type;
    this.status = line.status;
    this.metadata = line.metadata;
    this.isCancelable = function () {
        return line.isCancelable;
    };
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
 * @param {Object} mollieOrder - Mollie Order object
 */
function Order(mollieOrder) {
    var order = mollieOrder || {};
    var STATUS = config.getTransactionStatus();
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
            order.status === STATUS.SHIPPING;
    };
    this.isRefundable = function () {
        return (order.status === STATUS.PAID ||
            order.status === STATUS.SHIPPING ||
            order.status === STATUS.COMPLETED)
            && order.amountRefunded.value !== order.amount.value;
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
 * @param {Object} mollieIssuer - Mollie Issuer object
 */
function Issuer(mollieIssuer) {
    var issuer = mollieIssuer || {};
    this.resource = issuer.resource;
    this.id = issuer.id;
    this.name = issuer.name;
    this.image = issuer.image && issuer.image.svg;
}

/**
 *
 * @class
 * @param {Object} mollieMethod - Mollie Method object
 */
function Method(mollieMethod) {
    var method = mollieMethod || {};
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
 * @param {Object} mollieRefund - Mollie Refund object
 */
function Refund(mollieRefund) {
    var refund = mollieRefund || {};
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
}

/**
 *
 * @class
 * @param {Object} mollieShipment - Mollie Shipment object
 */
function Shipment(mollieShipment) {
    var shipment = mollieShipment || {};
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
 * @param {Object} mollieCustomer - Mollie Customer object
 */
function Customer(mollieCustomer) {
    var customer = mollieCustomer || {};
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
};
