/**
 *
 * @class
 * @param {Object} money - sfcc Money object
 */
function Currency(money) {
    money = money || {};
    this.currency = money.getCurrencyCode();
    this.value = money.getValue();
}

/**
 *
 * @class
 * @param {dw.order.OrderAddress} address - sfcc address object
 * @param {Object} address - sfcc address object
 * @returns
 */
function Address(address, profile) {
    return {
        organizationName: address.getCompanyName(),
        streetAndNumber: address.getAddress1(),
        streetAdditional: address.getAddress2(),
        city: address.getCity(),
        postalCode: address.getPostalCode(),
        country: address.getCountryCode(),
        title: address.getTitle(),
        givenName: address.getFirstName(),
        familyName: address.getLastName(),
        email: profile.getEmail()
    }
}

/**
 *
 * @class
 * @param {dw.order.ProductLineItem} address - sfcc productLineItem object
 */
function ProductLineItem(productLineItem) {
    return {
        sku: productLineItem.getProductID(),
        name: productLineItem.getProductName(),
        quantity: productLineItem.getQuantityValue(),
        vatRate: productLineItem.getTaxRate() * 100,
        vatAmount: new Currency(productLineItem.getTax()),
        unitPrice: new Currency(productLineitem.getAdjustedGrossPrice().divide(productLineItem.getQuantityValue())),
        totalAmount: new Currency(productLineitem.getAdjustedGrossPrice()),
    }
}

module.exports = {
    Currency: Currency,
    Address: Address,
    ProductLineItem: ProductLineItem
}
