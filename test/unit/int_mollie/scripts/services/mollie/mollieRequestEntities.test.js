const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieRequestEntities = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieRequestEntities`, {});

const {
    Currency,
    Address,
    ProductLineItem,
    ShippingLineItem,
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
});
