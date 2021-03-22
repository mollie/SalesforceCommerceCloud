const PaymentProviderException = require(`${base}/int_mollie/cartridge/scripts/exceptions/PaymentProviderException`);

describe('exceptions/PaymentProviderException', function () {
    before(function () {
        this.errorMessage = 'message';
        this.exception = new PaymentProviderException(this.errorMessage);
    });

    it('is a PaymentProviderException', function () {
        expect(this.exception).to.be.instanceOf(PaymentProviderException);
    });

    it('must be constructed with a message', function () {
        expect(this.exception.message).to.eql(this.errorMessage);
    });

    it('can be constructed with errorDetail', function () {
        const errorDetail = {
            more: 'information'
        };
        const exceptionWithDetail = new PaymentProviderException('message', errorDetail);
        expect(exceptionWithDetail.errorDetail).to.eql(errorDetail);
    });

    it('has a message', function () {
        expect(this.exception.message).to.be.a('string');
    });

    it('has errorDetail', function () {
        expect(this.exception.errorDetail).to.eql(null);
    });

    it('has a stacktrace', function () {
        expect(this.exception.stack).to.be.a('string');
        expect(this.exception.stack).to.have.string('PaymentProviderException\n');
    });

    it('can handle an absent stacktrace', function () {
        expect(this.exception.stack).to.be.a('string');
        expect(this.exception.stack).to.have.string('PaymentProviderException\n');
    });

    it('has a name', function () {
        expect(this.exception.name).to.eql('PaymentProviderException');
    });

    it('it inherits from Error', function () {
        expect(Object.getPrototypeOf(this.exception)).to.eql(Object.getPrototypeOf(new Error()));
    });
});
