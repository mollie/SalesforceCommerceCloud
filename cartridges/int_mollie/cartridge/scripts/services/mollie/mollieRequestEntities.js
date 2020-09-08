/**
 *
 * @class
 * @param {Object} money - sfcc Money object
 * @returns {Object} Request Currency object
 */
function Currency(money) {
    return {
        currency: money.getCurrencyCode(),
        value: money.getValue().toFixed(2)
    };
}

/**
 *
 * @class
 * @param {dw.order.OrderAddress} address - sfcc address object
 * @param {string} email - user email
 * @returns {Object} Request Address object
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
    };
}

/**
 *
 * @class
 * @param {dw.order.ProductLineItem} productLineItem - sfcc productLineItem object
 * @returns {Object} Request ProductLineItem object
 */
function ProductLineItem(productLineItem) {
    var lineItem = {
        sku: productLineItem.getProductID(),
        name: productLineItem.getProductName(),
        quantity: productLineItem.getQuantityValue(),
        vatRate: (productLineItem.getTaxRate() * 100).toFixed(2),
        vatAmount: new Currency(productLineItem.getAdjustedTax()),
        unitPrice: new Currency(productLineItem.getGrossPrice().divide(productLineItem.getQuantityValue())),
        totalAmount: new Currency(productLineItem.getAdjustedGrossPrice()),
        discountAmount: new Currency(productLineItem.getGrossPrice().subtract(productLineItem.getAdjustedGrossPrice()))
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
 * @returns {Object} Request ShippingLineItem object
 */
function ShippingLineItem(shippingLineItem) {
    return {
        name: 'shipping',
        quantity: 1,
        vatRate: (shippingLineItem.getTaxRate() * 100).toFixed(2),
        vatAmount: new Currency(shippingLineItem.getAdjustedTax()),
        unitPrice: new Currency(shippingLineItem.getGrossPrice()),
        totalAmount: new Currency(shippingLineItem.getAdjustedGrossPrice()),
        type: 'shipping_fee',
        discountAmount: new Currency(shippingLineItem.getGrossPrice().subtract(shippingLineItem.getAdjustedGrossPrice()))
    };
}

/**
 *
 * @class
 * @param {dw.order.PriceAdjustment} priceAdjustment - sfcc discountLineItem object
 * @returns {Object} Request DiscountLineItem object
 */
function DiscountLineItem(priceAdjustment) {
    var discount = new Currency(priceAdjustment.getGrossPrice());
    return {
        name: priceAdjustment.lineItemText,
        quantity: 1,
        vatRate: (priceAdjustment.getTaxRate() * 100).toFixed(2),
        vatAmount: new Currency(priceAdjustment.getTax()),
        unitPrice: discount,
        totalAmount: discount,
        type: 'discount'
    };
}

module.exports = {
    Currency: Currency,
    Address: Address,
    ProductLineItem: ProductLineItem,
    ShippingLineItem: ShippingLineItem,
    DiscountLineItem: DiscountLineItem
};
