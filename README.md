# README #
# link_mollie

This is the integration cartridge for Mollie

# Getting Started

1. Clone this repository.
2. Install npm dependancies `npm install`.
3. Upload the `cartridges` folder to the WebDav location for cartridges for your Sandbox through CyberDuck or any other WebDAV client.
4. Add the plugin_mollie and int_mollie cartridges to your cartridge path.


# Cartridges

## int_mollie

Contains all the business logic pertaining order and payment management through
the Mollie API.

## plugin_mollie

Contains Payment and Checkout controllers.

# Configuration

## Site Management

Add the following cartridges to the storefront site you want to use the payment on:

- int_mollie
- plugin_mollie

Add the following cartridges to the business manager site:

- bm_mollie
- int_mollie
- app_storefront_base

## Site Preferences 

- `mollieEnabledMode`: enum of strings
- `mollieBearerTestToken`: string
- `mollieBearerToken`: string
- `mollieProfileId`: string
- `mollieDefaultOrderExpiryDays`: number
- `mollieDefaultEnabledTransactionAPI`: enum of strings
- `mollieEnableSingleClickPayments`: boolean
- `mollieComponentsEnabled`: boolean
- `mollieLogCategory`: string
- `mollieApplePayVerificationString`: string

## Custom Properties

### PaymentMethod
- `molliePaymentMethodId`: string - external mollie payment method id
- `mollieOrderExpiryDays`: number - expiry days of order
- `mollieEnabledTransactionAPI`: enum of strings - the enabled transaction API

### PaymentTransaction
- `molliePaymentId`: string - the id of the Mollie payment
- `molliePaymentStatus`: string - the payment status recieved from Mollie
- `mollieIssuerData`: text - selected issuer data

### Order
- `mollieOrderId`: string - the id of the Mollie order
- `mollieOrderStatus`: string - the payment status recieved from Mollie
- `mollieUsedTransactionAPI`: string - api used for creating payment (payment / order)
- `mollieRefundStatus`: enum of strings - the status of the refund

### Profile
- `mollieCustomerId`: string - the id of the Mollie customer (used for single click payments)

### Product
- `mollieProductCategory`: enum of strings - category used for voucher metho

# NPM scripts
Use the provided NPM scripts to compile and upload changes to your Sandbox.

#Testing
You can run `npm test` to execute all unit tests in the project. Run `npm run test:coverage` to get coverage information. Coverage will be available in coverage folder under root directory.

# Mollie Documentation

- [Integration guide](https://docs.mollie.com/index/)
- [JSON Api Spec](https://docs.mollie.com/reference/v2/payments-api/create-payment)
