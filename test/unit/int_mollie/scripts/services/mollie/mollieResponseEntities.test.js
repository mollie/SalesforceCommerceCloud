const { stubs } = testHelpers;

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mollieResponseEntities = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/mollieResponseEntities`, {
    '*/cartridge/scripts/mollieConfig': stubs.configMock
});

const TRANSACTION_STATUS = {
    OPEN: 'open',
    CREATED: 'created',
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    PAID: 'paid',
    SHIPPING: 'shipping',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELED: 'canceled',
    FAILED: 'failed'
};

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
    Customer,
    ApplePayResponse
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
        it('has an isCancelable method', () => {
            expect(new Payment({ ...this.response, isCancelable: true })
                .isCancelable()).to.eql(true);

            expect(new Payment({ ...this.response, isCancelable: false })
                .isCancelable()).to.eql(false);
        });
        it('has isShippable method', () => {
            expect(this.default.isShippable()).to.eql(false);
        });
        it('has an isRefundable method', () => {
            expect(new Payment({ ...this.response, amountRemaining: { value: '5.00' } })
                .isRefundable()).to.eql(true);

            expect(new Payment({ ...this.response, amountRemaining: { value: '0.00' } })
                .isRefundable()).to.eql(false);
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
        it('has an isCancelable method', () => {
            expect(new Line({ ...this.response, isCancelable: true })
                .isCancelable()).to.eql(true);

            expect(new Line({ ...this.response, isCancelable: false })
                .isCancelable()).to.eql(false);
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

    describe('Order', () => {
        after(function () { stubs.reset(); });
        before(() => {
            stubs.configMock.getTransactionStatus.returns(TRANSACTION_STATUS);
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                profileId: faker.lorem.word(),
                method: faker.lorem.word(),
                amount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                status: faker.lorem.word(),
                isCancelable: faker.random.boolean(),
                metadata: {},
                createdAt: faker.lorem.word(),
                expiresAt: faker.lorem.word(),
                mode: faker.lorem.word(),
                locale: faker.lorem.word(),
                billingAddress: {},
                shopperCountryMustMatchBillingCountry: faker.lorem.word(),
                consumerDateOfBirth: faker.lorem.word(),
                orderNumber: faker.lorem.word(),
                amountRefunded: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                amountRemaining: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                shippingAddress: {},
                redirectUrl: faker.internet.url(),
                lines: [],
                _links: this.links,
                _embedded: {
                    payments: []
                }
            };
            this.default = new Order(this.response);
        });

        it('has a resource', () => {
            expect(this.default.resource).to.eql(this.response.resource);
        });
        it('has an id', () => {
            expect(this.default.id).to.eql(this.response.id);
        });
        it('has an profileId', () => {
            expect(this.default.profileId).to.eql(this.response.profileId);
        });
        it('has an method', () => {
            expect(this.default.method).to.eql(this.response.method);
        });
        it('has isCancelable method', () => {
            expect(new Order({ ...this.response, isCancelable: true })
                .isCancelable()).to.eql(true);

            expect(new Order({ ...this.response, isCancelable: false })
                .isCancelable()).to.eql(false);
        });
        it('has isShippable method', () => {
            expect(new Order({ ...this.response, status: TRANSACTION_STATUS.PAID })
                .isShippable()).to.eql(true);

            expect(new Order({ ...this.response, status: TRANSACTION_STATUS.FAILED })
                .isShippable()).to.eql(false);
        });
        it('has an isRefundable method', () => {
            expect(new Order({ ...this.response, amountRefunded: { value: '25.00' }, amount: { value: '50.00' }, status: TRANSACTION_STATUS.PAID })
                .isRefundable()).to.eql(true);

            expect(new Order({ ...this.response, amountRefunded: { value: '25.00' }, amount: { value: '50.00' }, status: TRANSACTION_STATUS.FAILED })
                .isRefundable()).to.eql(false);

            expect(new Order({ ...this.response, amountRefunded: { value: '50.00' }, amount: { value: '50.00' }, status: TRANSACTION_STATUS.PAID })
                .isRefundable()).to.eql(false);
        });
        it('has an metadata', () => {
            expect(this.default.metadata).to.eql(this.response.metadata);
        });
        it('has an createdAt', () => {
            expect(this.default.createdAt).to.eql(this.response.createdAt);
        });
        it('has an expiresAt', () => {
            expect(this.default.expiresAt).to.eql(this.response.expiresAt);
        });
        it('has an mode', () => {
            expect(this.default.mode).to.eql(this.response.mode);
        });
        it('has an locale', () => {
            expect(this.default.locale).to.eql(this.response.locale);
        });
        it('has an billingAddress', () => {
            expect(this.default.billingAddress).to.eql(new Address(this.response.billingAddress));
        });
        it('has an shopperCountryMustMatchBillingCountry', () => {
            expect(this.default.shopperCountryMustMatchBillingCountry).to.eql(this.response.shopperCountryMustMatchBillingCountry);
        });
        it('has an consumerDateOfBirth', () => {
            expect(this.default.consumerDateOfBirth).to.eql(this.response.consumerDateOfBirth);
        });
        it('has an amountRefunded', () => {
            expect(this.default.amountRefunded).to.eql(new Amount(this.response.amountRefunded));
        });
        it('has an shippingAddress', () => {
            expect(this.default.shippingAddress).to.eql(new Address(this.response.shippingAddress));
        });
        it('has an lines', () => {
            expect(this.default.lines).to.eql([]);
        });
        it('has an payments', () => {
            expect(this.default.payments).to.eql([]);
        });
        it('initializes without input', () => {
            expect(new Order()).to.be.an.instanceOf(Order);
        });
    });

    describe('Issuer', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                name: faker.lorem.word(),
                image: {
                    svg: faker.lorem.word()
                }
            };
            this.default = new Issuer(this.response);
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
        it('has an image', () => {
            expect(this.default.image).to.eql(this.response.image.svg);
        });
        it('initializes without input', () => {
            expect(new Issuer()).to.be.an.instanceOf(Issuer);
        });
    });

    describe('Method', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                description: faker.lorem.word(),
                minimumAmount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                maximumAmount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                image: {
                    svg: faker.lorem.word()
                },
                issuers: []
            };
            this.default = new Method(this.response);
        });

        it('has a resource', () => {
            expect(this.default.resource).to.eql(this.response.resource);
        });
        it('has an id', () => {
            expect(this.default.id).to.eql(this.response.id);
        });
        it('has an description', () => {
            expect(this.default.description).to.eql(this.response.description);
        });
        it('has an minimumAmount', () => {
            expect(this.default.minimumAmount).to.eql(new Amount(this.response.minimumAmount));
        });
        it('has an maximumAmount', () => {
            expect(this.default.maximumAmount).to.eql(new Amount(this.response.maximumAmount));
        });
        it('has an imageURL', () => {
            expect(this.default.imageURL).to.eql(this.response.image.svg);
        });
        it('has an list of issuers', () => {
            expect(this.default.issuers).to.eql(this.response.issuers);
        });
        it('initializes without input', () => {
            expect(new Method()).to.be.an.instanceOf(Method);
        });
    });

    describe('Refund', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                amount: {
                    value: faker.random.number(),
                    currency: faker.lorem.word()
                },
                createdAt: faker.lorem.word(),
                description: faker.lorem.word(),
                paymentId: faker.random.number(),
                orderId: faker.random.number(),
                lines: []
            };
            this.default = new Refund(this.response);
        });

        it('has a resource', () => {
            expect(this.default.resource).to.eql(this.response.resource);
        });
        it('has an id', () => {
            expect(this.default.id).to.eql(this.response.id);
        });
        it('has an amount', () => {
            expect(this.default.amount).to.eql(new Amount(this.response.amount));
        });
        it('has an createdAt', () => {
            expect(this.default.createdAt).to.eql(this.response.createdAt);
        });
        it('has an description', () => {
            expect(this.default.description).to.eql(this.response.description);
        });
        it('has an paymentId', () => {
            expect(this.default.paymentId).to.eql(this.response.paymentId);
        });
        it('has an orderId', () => {
            expect(this.default.orderId).to.eql(this.response.orderId);
        });
        it('has an list of lines', () => {
            expect(this.default.lines).to.eql(this.response.lines);
        });
        it('initializes without input', () => {
            expect(new Refund()).to.be.an.instanceOf(Refund);
        });
    });

    describe('Shipment', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                orderId: faker.lorem.word(),
                lines: []
            };
            this.default = new Refund(this.response);
        });

        it('has a resource', () => {
            expect(this.default.resource).to.eql(this.response.resource);
        });
        it('has an id', () => {
            expect(this.default.id).to.eql(this.response.id);
        });
        it('has an orderId', () => {
            expect(this.default.orderId).to.eql(this.response.orderId);
        });
        it('has an list of lines', () => {
            expect(this.default.lines).to.eql(this.response.lines);
        });
        it('initializes without input', () => {
            expect(new Shipment()).to.be.an.instanceOf(Shipment);
        });
    });

    describe('Customer', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                resource: faker.lorem.word(),
                id: faker.lorem.word(),
                name: faker.lorem.word(),
                email: faker.internet.email(),
                locale: faker.lorem.word(),
                createdDatetime: faker.lorem.word()
            };
            this.default = new Customer(this.response);
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
        it('has an name', () => {
            expect(this.default.name).to.eql(this.response.name);
        });
        it('has an email', () => {
            expect(this.default.email).to.eql(this.response.email);
        });
        it('has an locale', () => {
            expect(this.default.locale).to.eql(this.response.locale);
        });
        it('initializes without input', () => {
            expect(new Customer()).to.be.an.instanceOf(Customer);
        });
    });
    describe('ApplePayResponse', () => {
        after(function () { stubs.reset(); });
        before(() => {
            this.response = {
                epochTimestamp: faker.random.number(),
                merchantSessionIdentifier: faker.lorem.word(),
                nonce: faker.lorem.word(),
                merchantIdentifier: faker.lorem.word(),
                domainName: faker.internet.url(),
                displayName: faker.lorem.word(),
                signature: faker.lorem.word()
            };
            this.default = new ApplePayResponse(this.response);
        });

        it('has a epochTimestamp', () => {
            expect(this.default.epochTimestamp).to.eql(this.response.epochTimestamp);
        });
        it('has an merchantSessionIdentifier', () => {
            expect(this.default.merchantSessionIdentifier).to.eql(this.response.merchantSessionIdentifier);
        });
        it('has an nonce', () => {
            expect(this.default.nonce).to.eql(this.response.nonce);
        });
        it('has an merchantIdentifier', () => {
            expect(this.default.merchantIdentifier).to.eql(this.response.merchantIdentifier);
        });
        it('has an domainName', () => {
            expect(this.default.domainName).to.eql(this.response.domainName);
        });
        it('has an displayName', () => {
            expect(this.default.displayName).to.eql(this.response.displayName);
        });
        it('has an signature', () => {
            expect(this.default.signature).to.eql(this.response.signature);
        });
        it('initializes without input', () => {
            expect(new ApplePayResponse()).to.be.an.instanceOf(ApplePayResponse);
        });
    });
});
