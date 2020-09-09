const { fake } = require('sinon');

const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieResponseEntities = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieResponseEntities`, {
    '*/cartridge/scripts/mollieConfig': stubs.configMock
});

const {
    Amount,
    Link,
    Links,
    Address,
    Payment,
    Line,
    Order,
    Issuer,
    Method,
    Refund,
    Shipment,
    Customer
} = mollieResponseEntities;

describe('mollie/mollieResponseEntities', () => {
    before(function () { stubs.init(); });
    after(function () { stubs.restore(); });

    describe('Amount', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                value: faker.commerce.price(),
                currency: faker.lorem.word()
            };
            this.default = new Amount(this.response);
            this.links = {
                self: {
                    href: faker.internet.url(),
                    type: faker.lorem.word()
                },
                checkout: {
                    href: faker.internet.url(),
                    type: faker.lorem.word()
                },
                documentation: {
                    href: faker.internet.url(),
                    type: faker.lorem.word()
                }
            };
        });

        it('has a value', () => {
            expect(this.default.value).to.eql(this.response.value);
        });
        it('has an currency', () => {
            expect(this.default.currency).to.eql(this.response.currency);
        });
        it('initializes without input', () => {
            expect(new Amount()).to.be.an.instanceOf(Amount);
        });
    });

    describe('Link', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                href: faker.internet.url(),
                type: faker.lorem.word()
            };
            this.default = new Link(this.response);
        });

        it('has a href', () => {
            expect(this.default.href).to.eql(this.response.href);
        });
        it('has an type', () => {
            expect(this.default.type).to.eql(this.response.type);
        });
        it('initializes without input', () => {
            expect(new Link()).to.be.an.instanceOf(Link);
        });
    });

    describe('Links', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                self: {
                    href: faker.internet.url(),
                    type: faker.lorem.word()
                },
                checkout: {
                    href: faker.internet.url(),
                    type: faker.lorem.word()
                },
                documentation: {
                    href: faker.internet.url(),
                    type: faker.lorem.word()
                }
            };
            this.default = new Links(this.response);
        });

        it('has a self link object', () => {
            expect(this.default.self).to.eql(new Link(this.response.self));
        });
        it('has an checkout link object', () => {
            expect(this.default.checkout).to.eql(new Link(this.response.checkout));
        });
        it('has an documentation link object', () => {
            expect(this.default.documentation).to.eql(new Link(this.response.documentation));
        });
        it('initializes without input', () => {
            expect(new Links()).to.be.an.instanceOf(Links);
        });
    });

    describe('Address', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                organizationName: faker.lorem.word(),
                streetAndNumber: faker.lorem.word(),
                streetAdditional: faker.lorem.word(),
                city: faker.lorem.word(),
                region: faker.lorem.word(),
                postalCode: faker.random.number(),
                country: faker.lorem.word(),
                title: faker.lorem.word(),
                givenName: faker.lorem.word(),
                familyName: faker.lorem.word(),
                email: faker.lorem.word()
            };
            this.default = new Address(this.response);
        });

        it('has a organizationName', () => {
            expect(this.default.organizationName).to.eql(this.response.organizationName);
        });
        it('has an streetAndNumber', () => {
            expect(this.default.streetAndNumber).to.eql(this.response.streetAndNumber);
        });
        it('has an streetAdditional', () => {
            expect(this.default.streetAdditional).to.eql(this.response.streetAdditional);
        });
        it('has an city', () => {
            expect(this.default.city).to.eql(this.response.city);
        });
        it('has an region', () => {
            expect(this.default.region).to.eql(this.response.region);
        });
        it('has an postalCode', () => {
            expect(this.default.postalCode).to.eql(this.response.postalCode);
        });
        it('has an country', () => {
            expect(this.default.country).to.eql(this.response.country);
        });
        it('has an title', () => {
            expect(this.default.title).to.eql(this.response.title);
        });
        it('has an givenName', () => {
            expect(this.default.givenName).to.eql(this.response.givenName);
        });
        it('has an familyName', () => {
            expect(this.default.familyName).to.eql(this.response.familyName);
        });
        it('has an email', () => {
            expect(this.default.email).to.eql(this.response.email);
        });
        it('initializes without input', () => {
            expect(new Address()).to.be.an.instanceOf(Address);
        });
    });

    describe('Payment', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                mode: faker.lorem.word(),
                createdAt: faker.lorem.word(),
                amount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                description: faker.lorem.word(),
                method: faker.lorem.word(),
                metadata: {},
                status: faker.lorem.word(),
                amountRefunded: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                amountRemaining: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                expiresAt: faker.lorem.word(),
                details: faker.lorem.word(),
                profileId: faker.lorem.word(),
                sequenceType: faker.lorem.word(),
                redirectUrl: faker.internet.url(),
                webhookUrl: faker.internet.url(),
                _links: this.links
            };
            this.default = new Payment(this.response);
        });

        it('has a resource', () => {
            expect(this.default.resource).to.eql(this.response.resource);
        });
        it('has an id', () => {
            expect(this.default.id).to.eql(this.response.id);
        });
        it('has an mode', () => {
            expect(this.default.mode).to.eql(this.response.mode);
        });
        it('has an createdAt', () => {
            expect(this.default.createdAt).to.eql(this.response.createdAt);
        });
        it('has an amount', () => {
            expect(this.default.amount).to.eql(new Amount(this.response.amount));
        });
        it('has an description', () => {
            expect(this.default.description).to.eql(this.response.description);
        });
        it('has an method', () => {
            expect(this.default.method).to.eql(this.response.method);
        });
        it('has an metadata', () => {
            expect(this.default.metadata).to.eql(this.response.metadata);
        });
        it('has an status', () => {
            expect(this.default.status).to.eql(this.response.status);
        });
        it('has an amountRefunded', () => {
            expect(this.default.amountRefunded).to.eql(new Amount(this.response.amountRefunded));
        });
        it('has an amountRemaining', () => {
            expect(this.default.amountRemaining).to.eql(new Amount(this.response.amountRemaining));
        });
        it('has an expiresAt', () => {
            expect(this.default.expiresAt).to.eql(this.response.expiresAt);
        });
        it('has an details', () => {
            expect(this.default.details).to.eql(this.response.details);
        });
        it('has an profileId', () => {
            expect(this.default.profileId).to.eql(this.response.profileId);
        });
        it('has an redirectUrl', () => {
            expect(this.default.redirectUrl).to.eql(this.response.redirectUrl);
        });
        it('has an webhookUrl', () => {
            expect(this.default.webhookUrl).to.eql(this.response.webhookUrl);
        });
        it('has an links', () => {
            expect(this.default.links).to.eql(new Links(this.response._links));
        });
        it('initializes without input', () => {
            expect(new Payment()).to.be.an.instanceOf(Payment);
        });
    });

    describe('Line', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                name: faker.lorem.word(),
                sku: faker.lorem.word(),
                type: faker.lorem.word(),
                status: faker.lorem.word(),
                metadata: {},
                isCancelable: faker.random.boolean(),
                quantity: faker.random.number(),
                vatRate: faker.random.number(),
                vatAmount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                discountAmount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                totalAmount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                createdAt: faker.lorem.word(),
                quantityShipped: faker.random.number(),
                amountShipped: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                quantityRefunded: faker.random.number(),
                amountRefunded: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                quantityCanceled: faker.random.number(),
                amountCanceled: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                shippableQuantity: faker.random.number(),
                refundableQuantity: faker.random.number(),
                cancelableQuantity: faker.random.number()
            };
            this.default = new Line(this.response);
        });

        it('has a resource', () => {
            expect(this.default.resource).to.eql(this.response.resource);
        });
        it('has an id', () => {
            expect(this.default.id).to.eql(this.response.id);
        });
        it('has an name', () => {
            expect(this.default.name).to.eql(this.response.name);
        });
        it('has an sku', () => {
            expect(this.default.sku).to.eql(this.response.sku);
        });
        it('has an type', () => {
            expect(this.default.type).to.eql(this.response.type);
        });
        it('has an status', () => {
            expect(this.default.status).to.eql(this.response.status);
        });
        it('has an metadata', () => {
            expect(this.default.metadata).to.eql(this.response.metadata);
        });
        it('has an isCancelable', () => {
            expect(this.default.isCancelable).to.eql(this.response.isCancelable);
        });
        it('has an quantity', () => {
            expect(this.default.quantity).to.eql(this.response.quantity);
        });
        it('has an vatRate', () => {
            expect(this.default.vatRate).to.eql(this.response.vatRate);
        });
        it('has an vatAmount', () => {
            expect(this.default.vatAmount).to.eql(new Amount(this.response.vatAmount));
        });
        it('has an discountAmount', () => {
            expect(this.default.discountAmount).to.eql(new Amount(this.response.discountAmount));
        });
        it('has an totalAmount', () => {
            expect(this.default.totalAmount).to.eql(new Amount(this.response.totalAmount));
        });
        it('has an createdAt', () => {
            expect(this.default.createdAt).to.eql(this.response.createdAt);
        });
        it('has an quantityShipped', () => {
            expect(this.default.quantityShipped).to.eql(this.response.quantityShipped);
        });
        it('has an amountShipped', () => {
            expect(this.default.amountShipped).to.eql(new Amount(this.response.amountShipped));
        });
        it('has an quantityRefunded', () => {
            expect(this.default.quantityRefunded).to.eql(this.response.quantityRefunded);
        });
        it('has an amountRefunded', () => {
            expect(this.default.amountRefunded).to.eql(new Amount(this.response.amountRefunded));
        });
        it('has an quantityCanceled', () => {
            expect(this.default.quantityCanceled).to.eql(this.response.quantityCanceled);
        });
        it('has an amountCanceled', () => {
            expect(this.default.amountCanceled).to.eql(new Amount(this.response.amountCanceled));
        });
        it('has an shippableQuantity', () => {
            expect(this.default.shippableQuantity).to.eql(this.response.shippableQuantity);
        });
        it('has an refundableQuantity', () => {
            expect(this.default.refundableQuantity).to.eql(this.response.refundableQuantity);
        });
        it('has an cancelableQuantity', () => {
            expect(this.default.cancelableQuantity).to.eql(this.response.cancelableQuantity);
        });
        it('initializes without input', () => {
            expect(new Line()).to.be.an.instanceOf(Line);
        });
    });
});
