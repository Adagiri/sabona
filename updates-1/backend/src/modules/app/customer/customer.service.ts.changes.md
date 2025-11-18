# Customer Service Changes

Apply the following changes to `customer.service.ts`:

## 1. Update `calculateSubtotalFromServices` method (around line 116-136)

Update to use `expressPlatformPrice` instead of `expressPrice`:

```typescript
const serviceItem = await this._dbService.laundryServiceItem.findUnique({
    where: {
        id: item.id,
        laundryServiceId: service.serviceId,
    },
    select: {
        platformPrice: true,
        expressPlatformPrice: true,
        name: true,
    },
});

if (!serviceItem) {
    throw new BadRequestException(
        `Service item with ID ${item.id} not found or doesn't belong to service ${service.serviceId}`,
    );
}

// Choose price based on delivery type
const priceToUse =
    deliveryType === DeliveryType.EXPRESS ? serviceItem.expressPlatformPrice : serviceItem.platformPrice;

subtotal += priceToUse * item.quantity;
```

## 2. Update `CreateOrder` method - itemPricesMap (around line 270-294)

Update to include new fields in the prices map:

```typescript
const itemData = await this._dbService.laundryServiceItem.findUnique({
    where: { id: item.id },
    select: {
        vendorPrice: true,
        platformPrice: true,
        expressVendorPrice: true,
        expressPlatformPrice: true,
        name: true,
        laundryService: {
            select: { name: true },
        },
    },
});

if (!itemData) {
    throw new BadRequestException(`Item ${item.id} not found`);
}

itemPricesMap.set(item.id, {
    vendorPrice: itemData.vendorPrice,
    platformPrice: itemData.platformPrice,
    expressVendorPrice: itemData.expressVendorPrice,
    expressPlatformPrice: itemData.expressPlatformPrice,
    itemName: itemData.name,
    serviceName: itemData.laundryService.name,
});
```

## 3. Update `CreateOrder` method - order item snapshots (around line 369-380)

Update the items creation to include new snapshot fields:

```typescript
services: {
    create: data.services.map((service) => ({
        laundryServiceId: service.serviceId,
        items: {
            create: service.items.map((item) => {
                const priceSnapshot = itemPricesMap.get(item.id);

                return {
                    laundryServiceItemId: item.id,
                    quantity: item.quantity,
                    vendorPriceSnapshot: priceSnapshot.vendorPrice,
                    platformPriceSnapshot: priceSnapshot.platformPrice,
                    expressVendorPriceSnapshot: priceSnapshot.expressVendorPrice,
                    expressPlatformPriceSnapshot: priceSnapshot.expressPlatformPrice,
                    itemName: priceSnapshot.itemName,
                    serviceName: priceSnapshot.serviceName,
                };
            }),
        },
    })),
},
```
