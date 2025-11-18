# Vendor Service Changes

Apply the following changes to `vendor.service.ts`:

## 1. Update `addLaundryServiceItem` method (around line 981-991)

Change the items mapping to include new fields:

```typescript
const items = data.items.map((item) => ({
    nameLocale: item.nameLocale,
    name: item.nameLocale.en, // Auto-populate from English
    vendorPrice: item.vendorPrice,
    platformPrice: item.platformPrice,
    expressVendorPrice: item.expressVendorPrice,
    expressPlatformPrice: item.expressPlatformPrice,
    categoryId: item.categoryId,
    subCategoryId: item.subCategoryId,
    sortOrder: item.sortOrder,
    laundryServiceId: serviceId,
}));
```

## 2. Update `editLaundryServiceItem` method (around line 1091-1093)

Add conditional updates for the new fields after the expressPrice check:

```typescript
if (data.vendorPrice !== undefined) {
    updateData.vendorPrice = data.vendorPrice;
}

if (data.platformPrice !== undefined) {
    updateData.platformPrice = data.platformPrice;
}

if (data.expressVendorPrice !== undefined) {
    updateData.expressVendorPrice = data.expressVendorPrice;
}

if (data.expressPlatformPrice !== undefined) {
    updateData.expressPlatformPrice = data.expressPlatformPrice;
}
```

## 3. Update `getAllLaundryServiceItems` method (around line 1190-1225)

Update the select to include new fields and add backward compatibility mapping:

```typescript
async getAllLaundryServiceItems(laundryId: string, serviceId: string): Promise<any> {
    const laundry = await this._dbService.laundry.findFirst({
        where: {
            id: laundryId,
        },
    });

    if (!laundry) {
        throw new BadRequestException('Laundry does not exist');
    }

    const service = await this._dbService.laundryService.findFirst({
        where: {
            id: serviceId,
            laundryId: laundryId,
        },
    });

    if (!service) {
        throw new BadRequestException('Service does not exist');
    }

    const items = await this._dbService.laundryServiceItem.findMany({
        where: {
            laundryServiceId: serviceId,
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
            nameLocale: true,
            createdAt: true,
            vendorPrice: true,
            platformPrice: true,
            expressVendorPrice: true,
            expressPlatformPrice: true,
            category: {
                select: {
                    id: true,
                    name: true,
                    nameLocale: true,
                    icon: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            media: {
                                select: {
                                    id: true,
                                    path: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // Add backward compatibility: map expressPlatformPrice to expressPrice
    const itemsWithBackwardCompat = items.map(item => ({
        ...item,
        expressPrice: item.expressPlatformPrice, // For backward compatibility
    }));

    return { data: itemsWithBackwardCompat };
}
```

## 4. Update `getItemsByCategory` method (around line 1663-1706)

Similar backward compatibility mapping:

```typescript
// After the items query, before returning:
const itemsWithBackwardCompat = items.map(item => ({
    ...item,
    expressPrice: item.expressPlatformPrice, // For backward compatibility
}));

return { data: itemsWithBackwardCompat };
```
