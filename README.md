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

## bc_jobs_mollie

Contains a job to check for orders that have not been completed after 24 hours (configurable) and fails them. If by any chance the payment flow was completed for this order but failed to update the state, the job will complete the order.

## bc_csc_mollie

Contains refund action on the order page of the Customer Service Centre.

# Payment Security //TODO

# Configuration

## Site Management

Add the following cartridges to the storefront site you want to use the payment on:

- int_mollie
- plugin_mollie

Add the following cartridges to the business manager site:

- int_mollie
- bc_csc_mollie
- bc_jobs_mollie

## Site Preferences 

- `mollieBearerToken`: string
- `mollieEnabledTransactionAPI`: enum of strings
- `mollieOrderDefaultExpiryDays`: number
- `mollieLogCategory`: string
- `mollieComponentsEnabled`: boolean
- `mollieComponentsEnableTestMode`: boolean
- `mollieComponentsProfileId`: string
- `mollieEnableSingleClickPayments`: boolean

## Custom Properties

### PaymentMethod
- `molliePaymentMethodId`: string - external mollie payment method id
- `mollieOrderExpiryDays`: number - expiry days of order

### PaymentTransaction
- `molliePaymentId`: string - the id of the Mollie payment
- `molliePaymentStatus`: string - the payment status recieved from Mollie

### Order
- `mollieOrderId`: string - the id of the Mollie order
- `mollieOrderStatus`: string - the payment status recieved from Mollie
- `mollieUsedTransactionAPI`: string - api used for creating payment (payment / order)

### Profile
- `mollieCustomerId`: string - the id of the Mollie customer (used for single click payments)

### Product
- `mollieProductCategory`: enum of strings - category used for voucher method


## Custom objects

### Refund

# NPM scripts
Use the provided NPM scripts to compile and upload changes to your Sandbox.

#Testing
You can run `npm test` to execute all unit tests in the project. Run `npm run test:coverage` to get coverage information. Coverage will be available in coverage folder under root directory.

# Mollie Documentation

- [Integration guide](https://docs.mollie.com/index/)
- [JSON Api Spec](https://docs.mollie.com/reference/v2/payments-api/create-payment)
