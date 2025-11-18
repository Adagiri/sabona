# Prisma Schema Changes

Apply the following changes to your `schema.prisma` file:

## 1. Update LaundryServiceItem model (around line 553)

Add two new fields after `expressPrice`:

```prisma
model LaundryServiceItem {
  id               String                  @id @default(uuid())
  laundryServiceId String
  laundryService   LaundryService          @relation(fields: [laundryServiceId], references: [id])
  categoryId       String?
  category         LaundryItemCategory?    @relation(fields: [categoryId], references: [id])
  subCategoryId    String?
  subCategory      LaundryItemSubCategory? @relation(fields: [subCategoryId], references: [id])
  name             String
  nameLocale       Json?
  sortOrder        Int? // For custom sorting of items within a category

  vendorPrice             Float // What vendor receives (normal delivery)
  platformPrice           Float // What user pays (normal delivery)
  expressVendorPrice      Float // What vendor receives (express delivery)
  expressPlatformPrice    Float // What user pays (express delivery)
  price                   Float?
  createdAt               DateTime                  @default(now()) @db.Timestamptz()
  updatedAt               DateTime                  @default(now()) @updatedAt @db.Timestamptz()
  deletedAt               DateTime?                 @db.Timestamptz()
  OrderLaundryServiceItem OrderLaundryServiceItem[]
}
```

## 2. Update OrderLaundryServiceItem model (around line 589)

Add two new snapshot fields:

```prisma
model OrderLaundryServiceItem {
  id                    String              @id @default(uuid())
  orderLaundryServiceId String
  orderLaundryService   OrderLaundryService @relation(fields: [orderLaundryServiceId], references: [id])
  laundryServiceItemId  String
  laundryServiceItem    LaundryServiceItem  @relation(fields: [laundryServiceItemId], references: [id])
  quantity              Int

  // CRITICAL: Price snapshots at time of order (prevents historical data corruption)
  vendorPriceSnapshot           Float // Vendor's earning per item at order time (normal)
  platformPriceSnapshot         Float // Platform price at order time (normal)
  expressVendorPriceSnapshot    Float? // Vendor's earning per item at order time (express)
  expressPlatformPriceSnapshot  Float? // Platform price at order time (express)
  itemName                      String? // Item name snapshot
  serviceName                   String? // Service name snapshot

  createdAt DateTime @default(now()) @db.Timestamptz()
  updatedAt DateTime @default(now()) @updatedAt @db.Timestamptz()
}
```

## Summary of Changes

- **LaundryServiceItem**: Added `expressVendorPrice` and `expressPlatformPrice` fields
- **OrderLaundryServiceItem**: Added `expressVendorPriceSnapshot` and `expressPlatformPriceSnapshot` fields
