const { expect } = require('chai');

const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieRequestEntities = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieRequestEntities`, {
    '*/cartridge/scripts/services/mollie/mollieRequestEntities': stubs.mollieRequestEntitiesMock
});

const {
    Currency,
    Address,
    ProductLineItem,
    ShippingLineItem,
    DiscountLineItem,
    Lines
} = mollieRequestEntities;

describe('mollie/mollieRequestEntities', () => {
    before(function () { stubs.init(); });
    after(function () { stubs.restore(); });

    describe('Currency', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.money = {
                value: faker.random.number({ precision: 0.01 }),
                currencyCode: faker.lorem.word()
            };
            this.default = new Currency(this.money);
        });

        it('has a value', () => {
            expect(this.default.value).to.eql(this.money.value.toFixed(2));
        });
        it('has an currency', () => {
            expect(this.default.currency).to.eql(this.money.currencyCode);
        });
    });

    describe('Address', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.address = {
                companyName: faker.lorem.word(),
                address1: faker.lorem.word(),
                address2: faker.lorem.word(),
                city: faker.lorem.word(),
                postalCode: faker.lorem.word(),
                countryCode: {
                    value: faker.random.number({ precision: 0.01 })
                },
                title: faker.lorem.word(),
                givenName: faker.lorem.word(),
                familyName: faker.lorem.word()
            };
            this.email = faker.internet.email();
            this.default = new Address(this.address, this.email);
        });

        it('has a organizationName', () => {
            expect(this.default.organizationName).to.eql(this.address.companyName);
        });
        it('has an address1', () => {
            expect(this.default.streetAndNumber).to.eql(this.address.address1);
        });
        it('has an address2', () => {
            expect(this.default.streetAdditional).to.eql(this.address.address2);
        });
        it('has an city', () => {
            expect(this.default.city).to.eql(this.address.city);
        });
        it('has an postalCode', () => {
            expect(this.default.postalCode).to.eql(this.address.postalCode);
        });
        it('has an country', () => {
            expect(this.default.country).to.eql(this.address.countryCode.value);
        });
        it('has an title', () => {
            expect(this.default.title).to.eql(this.address.title);
        });
        it('has an givenName', () => {
            expect(this.default.givenName).to.eql(this.address.firstName);
        });
        it('has an familyName', () => {
            expect(this.default.familyName).to.eql(this.address.lastName);
        });
        it('has an email', () => {
            expect(this.default.email).to.eql(this.email);
        });
    });

    describe('ProductLineItem', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.productLineItem = {
                productID: faker.lorem.word(),
                productName: faker.lorem.word(),
                quantityValue: faker.random.number(),
                taxRate: faker.random.number({ precision: 0.01 }),
                adjustedTax: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word()
                },
                grossPrice: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word(),
                    divide: (quantity) => {
                        return {
                            value: this.productLineItem.grossPrice.value / quantity,
                            currencyCode: this.productLineItem.grossPrice.currencyCode
                        };
                    },
                    subtract: (money) => {
                        return {
                            value: this.productLineItem.grossPrice.value - money.value,
                            currencyCode: this.productLineItem.grossPrice.currencyCode
                        };
                    }
                },
                adjustedGrossPrice: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word()
                },
                product: {
                    custom: {
                        mollieProductCategory: {
                            value: faker.lorem.word()
                        }
                    }
                }
            };
            this.default = new ProductLineItem(this.productLineItem);
        });

        it('has a sku', () => {
            expect(this.default.sku).to.eql(this.productLineItem.productID);
        });
        it('has an name', () => {
            expect(this.default.name).to.eql(this.productLineItem.productName);
        });
        it('has an quantity', () => {
            expect(this.default.quantity).to.eql(this.productLineItem.quantityValue);
        });
        it('has an vatRate', () => {
            expect(this.default.vatRate).to.eql((this.productLineItem.taxRate * 100).toFixed(2));
        });
        it('has an vatAmount', () => {
            expect(this.default.vatAmount).to.eql(new Currency(this.productLineItem.adjustedTax));
        });
        it('has an unitPrice', () => {
            expect(this.default.unitPrice).to.eql(new Currency({
                value: this.productLineItem.grossPrice.value / this.productLineItem.quantityValue,
                currencyCode: this.productLineItem.grossPrice.currencyCode
            }));
        });
        it('has an totalAmount', () => {
            expect(this.default.totalAmount).to.eql(new Currency(this.productLineItem.adjustedGrossPrice));
        });
        it('has an discountAmount', () => {
            expect(this.default.discountAmount).to.eql(new Currency({
                value: this.productLineItem.grossPrice.value - this.productLineItem.adjustedGrossPrice.value,
                currencyCode: this.productLineItem.grossPrice.currencyCode
            }));
        });
        it('has an category', () => {
            expect(this.default.category).to.eql(this.productLineItem.product.custom.mollieProductCategory.value);
        });
    });

    describe('ShippingLineItem', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.shippingLineItem = {
                lineItemText: faker.lorem.word(),
                taxRate: faker.random.number({ precision: 0.01 }),
                adjustedTax: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word()
                },
                grossPrice: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word(),
                    subtract: (money) => {
                        return {
                            value: this.shippingLineItem.grossPrice.value - money.value,
                            currencyCode: this.shippingLineItem.grossPrice.currencyCode
                        };
                    }
                },
                adjustedGrossPrice: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word()
                }
            };
            this.default = new ShippingLineItem(this.shippingLineItem);
        });

        it('has a name', () => {
            expect(this.default.name).to.eql(this.shippingLineItem.lineItemText);
        });
        it('has an quantity', () => {
            expect(this.default.quantity).to.eql(1);
        });
        it('has an vatRate', () => {
            expect(this.default.vatRate).to.eql((this.shippingLineItem.taxRate * 100).toFixed(2));
        });
        it('has an vatAmount', () => {
            expect(this.default.vatAmount).to.eql(new Currency(this.shippingLineItem.adjustedTax));
        });
        it('has an unitPrice', () => {
            expect(this.default.unitPrice).to.eql(new Currency(this.shippingLineItem.grossPrice));
        });
        it('has an totalAmount', () => {
            expect(this.default.totalAmount).to.eql(new Currency(this.shippingLineItem.adjustedGrossPrice));
        });
        it('has an type', () => {
            expect(this.default.type).to.eql('shipping_fee');
        });
        it('has an discountAmount', () => {
            expect(this.default.discountAmount).to.eql(new Currency({
                value: this.shippingLineItem.grossPrice.value - this.shippingLineItem.adjustedGrossPrice.value,
                currencyCode: this.shippingLineItem.grossPrice.currencyCode
            }));
        });
    });

    describe('DiscountLineItem', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.discountLineItem = {
                lineItemText: faker.lorem.word(),
                taxRate: faker.random.number({ precision: 0.01 }),
                tax: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word()
                },
                grossPrice: {
                    value: faker.random.number({ precision: 0.01 }),
                    currencyCode: faker.lorem.word()
                }
            };
            this.default = new DiscountLineItem(this.discountLineItem);
        });

        it('has a name', () => {
            expect(this.default.name).to.eql(this.discountLineItem.lineItemText);
        });
        it('has an quantity', () => {
            expect(this.default.quantity).to.eql(1);
        });
        it('has an vatRate', () => {
            expect(this.default.vatRate).to.eql((this.discountLineItem.taxRate * 100).toFixed(2));
        });
        it('has an vatAmount', () => {
            expect(this.default.vatAmount).to.eql(new Currency(this.discountLineItem.tax));
        });
        it('has an unitPrice', () => {
            expect(this.default.unitPrice).to.eql(new Currency(this.discountLineItem.grossPrice));
        });
        it('has an totalAmount', () => {
            expect(this.default.totalAmount).to.eql(new Currency(this.discountLineItem.grossPrice));
        });
        it('has an type', () => {
            expect(this.default.type).to.eql('discount');
        });
    });

    describe('Lines', () => {
        after(function () { stubs.reset(); });
        before(() => {
            const productLineItems = [
                {
                    id: faker.random.uuid()
                },
                {
                    id: faker.random.uuid()
                },
                {
                    id: faker.random.uuid()
                }
            ];
            const shippingLineItems = [
                {
                    id: faker.random.uuid()
                },
                {
                    id: faker.random.uuid()
                },
                {
                    id: faker.random.uuid()
                }
            ];
            const priceAdjustments = [
                {
                    id: faker.random.uuid()
                },
                {
                    id: faker.random.uuid()
                },
                {
                    id: faker.random.uuid()
                }
            ];
            this.productLineItems = {
                toArray: () => productLineItems
            };

            this.shipments = {
                toArray: () => {
                    return [
                        {
                            getShippingLineItems: () => {
                                return {
                                    toArray: () => shippingLineItems
                                };
                            }
                        }
                    ];
                }
            };
            this.priceAdjustments = {
                toArray: () => priceAdjustments
            };
            this.default = new Lines(this.productLineItems, this.shipments, this.priceAdjustments);
        });

        it('it calls new ProductLineItem (productLineItems.length) times ', () => {
            var productLineItems = this.productLineItems.toArray();
            var length = productLineItems.length;
            expect(stubs.mollieRequestEntitiesMock.ProductLineItem).to.have.callCount(length);
            expect(stubs.mollieRequestEntitiesMock.ProductLineItem.getCall(0)).calledWithExactly(productLineItems[0]);
            expect(stubs.mollieRequestEntitiesMock.ProductLineItem.getCall(1)).calledWithExactly(productLineItems[1]);
            expect(stubs.mollieRequestEntitiesMock.ProductLineItem.getCall(2)).calledWithExactly(productLineItems[2]);
        });
        it('it calls new ShippingLineItem (shippingLineItems.length) times ', () => {
            var shippingLineItems = this.shipments.toArray()[0].getShippingLineItems().toArray();
            var length = shippingLineItems.length;
            expect(stubs.mollieRequestEntitiesMock.ShippingLineItem).to.have.callCount(length);
            expect(stubs.mollieRequestEntitiesMock.ShippingLineItem.getCall(0)).calledWithExactly(shippingLineItems[0]);
            expect(stubs.mollieRequestEntitiesMock.ShippingLineItem.getCall(1)).calledWithExactly(shippingLineItems[1]);
            expect(stubs.mollieRequestEntitiesMock.ShippingLineItem.getCall(2)).calledWithExactly(shippingLineItems[2]);
        });
        it('it calls new DiscountLineItem (priceAdjustments.length) times', () => {
            var priceAdjustments = this.priceAdjustments.toArray();
            var length = priceAdjustments.length;
            expect(stubs.mollieRequestEntitiesMock.DiscountLineItem).to.have.callCount(length);
            expect(stubs.mollieRequestEntitiesMock.DiscountLineItem.getCall(0)).calledWithExactly(priceAdjustments[0]);
            expect(stubs.mollieRequestEntitiesMock.DiscountLineItem.getCall(1)).calledWithExactly(priceAdjustments[1]);
            expect(stubs.mollieRequestEntitiesMock.DiscountLineItem.getCall(2)).calledWithExactly(priceAdjustments[2]);
        });
    });
});
