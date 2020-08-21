/**
 *
 * @class
 * @param {Object} money - sfcc Money object
 */
function Currency(money) {
    money = money || {};
    var test1 = money.getValue();
    var test2 = test1.toFixed(2);
    this.currency = money.getCurrencyCode();
    this.value = test2;
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
        country: address.getCountryCode().value,
        title: address.getTitle(),
        givenName: address.getFirstName(),
        familyName: address.getLastName(),
        email: profile.getEmail()
    }
}

/**
 *
 * @class
 * @param {dw.order.ProductLineItem} productLineItem - sfcc productLineItem object
 */
function ProductLineItem(productLineItem) {
    return {
        sku: productLineItem.getProductID(),
        name: productLineItem.getProductName(),
        quantity: productLineItem.getQuantityValue(),
        vatRate: productLineItem.getTaxRate() * 100,
        vatAmount: new Currency(productLineItem.getTax()),
        unitPrice: new Currency(productLineItem.getAdjustedGrossPrice().divide(productLineItem.getQuantityValue())),
        totalAmount: new Currency(productLineItem.getAdjustedGrossPrice()),
    }
}

module.exports = {
    Currency: Currency,
    Address: Address,
    ProductLineItem: ProductLineItem
}
