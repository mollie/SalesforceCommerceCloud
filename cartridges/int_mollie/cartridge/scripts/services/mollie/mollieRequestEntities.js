/**
 *
 * @class
 * @param {Object} money - sfcc Money object
 * @returns {Object} Request Currency object
 */
function Currency(money) {
    return {
        currency: money.currencyCode,
        value: money.value.toFixed(2)
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
        organizationName: address.companyName,
        streetAndNumber: address.address1,
        streetAdditional: address.address2,
        city: address.city,
        postalCode: address.postalCode,
        country: address.countryCode.value,
        title: address.title,
        givenName: address.firstName,
        familyName: address.lastName,
        email: email
    };
}

/**
 *
 * @class
 * @param {dw.order.ProductLineItem} productLineItem - sfcc productLineItem object
 * @param {string} orderLineCategory - the default order line catrgory from the selected payment method
 * @returns {Object} Request ProductLineItem object
 */
function ProductLineItem(productLineItem, orderLineCategory) {
    var lineItem = {
        sku: productLineItem.productID,
        name: productLineItem.productName,
        quantity: productLineItem.quantityValue,
        vatRate: (productLineItem.taxRate * 100).toFixed(2),
        vatAmount: new Currency(productLineItem.adjustedTax),
        unitPrice: new Currency(productLineItem.grossPrice.divide(productLineItem.quantityValue)),
        totalAmount: new Currency(productLineItem.adjustedGrossPrice),
        discountAmount: new Currency(productLineItem.grossPrice.subtract(productLineItem.adjustedGrossPrice))
    };

    var productCategory = productLineItem.product.custom.mollieProductCategory;
    if (productCategory && productCategory.value) {
        lineItem.category = productCategory.value;
    } else if (orderLineCategory) {
        lineItem.category = orderLineCategory.value;
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
        name: shippingLineItem.lineItemText,
        quantity: 1,
        vatRate: (shippingLineItem.taxRate * 100).toFixed(2),
        vatAmount: new Currency(shippingLineItem.adjustedTax),
        unitPrice: new Currency(shippingLineItem.grossPrice),
        totalAmount: new Currency(shippingLineItem.adjustedGrossPrice),
        type: 'shipping_fee',
        discountAmount: new Currency(shippingLineItem.grossPrice.subtract(shippingLineItem.adjustedGrossPrice))
    };
}

/**
 *
 * @class
 * @param {dw.order.PriceAdjustment} priceAdjustment - sfcc discountLineItem object
 * @returns {Object} Request DiscountLineItem object
 */
function DiscountLineItem(priceAdjustment) {
    var discount = new Currency(priceAdjustment.grossPrice);
    return {
        name: priceAdjustment.lineItemText,
        quantity: 1,
        vatRate: (priceAdjustment.taxRate * 100).toFixed(2),
        vatAmount: new Currency(priceAdjustment.tax),
        unitPrice: discount,
        totalAmount: discount,
        type: 'discount'
    };
}

/**
 *
 * @class
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product product line items
 * @param {dw.util.Collection<dw.order.ShippingLineItem>} shipments - the product shipping line items
 * @param {dw.util.Collection<dw.order.PriceAdjustment>} priceAdjustments - the product price adjustments
 * @param {string} orderLineCategory - the default order line catrgory from the selected payment method
 * @returns {Object} Request Lines object
 */
function Lines(productLineItems, shipments, priceAdjustments, orderLineCategory) {
    var mollieRequestEntities = require('*/cartridge/scripts/services/mollie/mollieRequestEntities');
    var lines = [];

    productLineItems.toArray().forEach(function (productLineItem) {
        lines.push(new mollieRequestEntities.ProductLineItem(productLineItem, orderLineCategory));
        if (productLineItem.shippingLineItem) {
            lines.push(new mollieRequestEntities.ShippingLineItem(productLineItem.shippingLineItem));
        }
    });

    shipments.toArray().forEach(function (shipment) {
        shipment.getShippingLineItems().toArray().forEach(function (shippingLineItem) {
            lines.push(new mollieRequestEntities.ShippingLineItem(shippingLineItem));
        });
    });

    priceAdjustments.toArray().forEach(function (priceAdjustment) {
        lines.push(new mollieRequestEntities.DiscountLineItem(priceAdjustment));
    });

    return lines;
}

module.exports = {
    Currency: Currency,
    Address: Address,
    ProductLineItem: ProductLineItem,
    ShippingLineItem: ShippingLineItem,
    DiscountLineItem: DiscountLineItem,
    Lines: Lines
};
