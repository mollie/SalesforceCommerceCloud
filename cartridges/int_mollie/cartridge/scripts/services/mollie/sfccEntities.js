/**
 *
 * @class
 * @param {Object} money - sfcc Money object
 */
function Currency(money) {
    money = money || {};
    this.currency = money.getCurrencyCode();
    this.value = money.getValue().toFixed(2);
}

/**
 *
 * @class
 * @param {dw.order.OrderAddress} address - sfcc address object
 * @param {string} email - user email
 * @param {Object} address - sfcc address object
 * @returns
 */
function Address(address, email) {
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
        email: email
    }
}

/**
 *
 * @class
 * @param {dw.order.ProductLineItem} productLineItem - sfcc productLineItem object
 */
function ProductLineItem(productLineItem) {
    var lineItem = {
        sku: productLineItem.getProductID(),
        name: productLineItem.getProductName(),
        quantity: productLineItem.getQuantityValue(),
        vatRate: productLineItem.getTaxRate() * 100,
        vatAmount: new Currency(productLineItem.getTax()),
        unitPrice: new Currency(productLineItem.getAdjustedGrossPrice().divide(productLineItem.getQuantityValue())),
        totalAmount: new Currency(productLineItem.getAdjustedGrossPrice()),
    };

    var productCategory = productLineItem.product.custom.mollieProductCategory;
    if (productCategory) {
        lineItem.category = productCategory.value;
    }

    return lineItem;
}

/**
 *
 * @class
 * @param {dw.order.ShippingLineItem} shippingLineItem - sfcc shippingLineItem object
 */
function ShippingLineItem(shippingLineItem) {
    var shippingCost = new Currency(shippingLineItem.getAdjustedGrossPrice());
    return {
        name: 'shipping',
        quantity: 1,
        vatRate: shippingLineItem.getTaxRate() * 100,
        vatAmount: new Currency(shippingLineItem.getTax()),
        unitPrice: shippingCost,
        totalAmount: shippingCost,
        type: 'shipping_fee'
    }
}

module.exports = {
    Currency: Currency,
    Address: Address,
    ProductLineItem: ProductLineItem,
    ShippingLineItem: ShippingLineItem
}
