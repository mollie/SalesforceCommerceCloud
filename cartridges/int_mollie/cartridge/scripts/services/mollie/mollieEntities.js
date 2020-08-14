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
    this.isCancelable = payment.isCancelable;
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
    order = order || {};
    this.resource = order.resource;
    this.id = order.id;
    this.profileId = order.profileId,
        this.method = order.method,
        this.amount = new Amount(order.amount);
    this.status = order.status;
    this.isCancelable = order.isCancelable;
    this.metadata = order.metadata;
    this.createdAt = order.createdAt;
    this.expiresAt = order.expiresAt;
    this.mode = order.mode;
    this.locale = order.locale;
    this.billingAddress = new Address(order.billingAddress);
    this.shopperCountryMustMatchBillingCountry = order.shopperCountryMustMatchBillingCountry;
    this.consumerDateOfBirth = order.consumerDateOfBirth;
    this.orderNumber = order.orderNumber;
    this.shippingAddress = new Address(order.shippingAddress);
    this.redirectUrl = order.redirectUrl;
    this.links = new Links(order._links);
    this.payments = order._embedded && order._embedded.payments ?
        order._embedded.payments.map(function (payment) {
            return new Payment(payment);
        }) : null;
}

module.exports = {
    Amount: Amount,
    Link: Link,
    Links: Links,
    Address: Address,
    Payment: Payment,
    Order: Order,
    Line: Line
}
