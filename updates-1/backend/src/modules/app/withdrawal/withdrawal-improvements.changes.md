# Withdrawal System Improvements

## 1. Schema Changes

Add to `schema.prisma`:

```prisma
// In AdminSettings model, add after expressMultiplier:
  // Transfer Charge Configuration
  transferChargeType TransferChargeType @default(PERCENTAGE)
  transferChargeRate Float              @default(1.0) // 1% or 1 SAR fixed

// In Order model, add after deletedAt:
  vendorEarningDisbursed Boolean   @default(false)
  disbursedAt            DateTime? @db.Timestamptz()
  withdrawalId           String?

// Add new enum
enum TransferChargeType {
  PERCENTAGE
  FIXED
}
```

## 2. Update `initiateWithdrawal` method

Replace the earnings calculation section (around lines 63-109) with:

```typescript
async initiateWithdrawal() {
    try {
        const pendingWithdrawal = await this._dbService.withdrawal.findFirst({
            where: {
                status: WithdrawalStatus.PENDING,
                deletedAt: null,
            },
        });

        if (pendingWithdrawal) {
            throw new BadRequestException('Cannot initiate new withdrawal. A pending withdrawal already exists.');
        }

        const settings = await this._dbService.adminSettings.findFirst();
        if (!settings) {
            throw new BadRequestException('Admin settings not configured');
        }

        const now = new Date();
        const startDate = settings.lastWithdrawalTimestamp || new Date('2025-06-01');

        const laundries = await this._dbService.laundry.findMany({
            where: {
                vendor: {
                    status: 'ACTIVE',
                    type: UserType.VENDOR,
                },
            },
            include: {
                vendor: {
                    select: {
                        id: true,
                        vendorRelationAsBranch: {
                            select: {
                                mainVendorId: true,
                            },
                        },
                    },
                },
            },
        });

        const withdrawal = await this._dbService.withdrawal.create({
            data: {
                startDate,
                endDate: now,
                status: WithdrawalStatus.PENDING,
            },
        });

        const laundryEarnings = await Promise.all(
            laundries.map(async (laundry) => {
                const isBranch = !!laundry.vendor.vendorRelationAsBranch;
                const mainVendorId = isBranch ? laundry.vendor.vendorRelationAsBranch.mainVendorId : null;

                const orders = await this._dbService.order.findMany({
                    where: {
                        laundryId: laundry.id,
                        status: OrderStatus.COMPLETED,
                        vendorEarningDisbursed: false, // Only undisbursed orders
                        createdAt: {
                            gt: startDate,
                            lte: now,
                        },
                    },
                    include: {
                        services: {
                            include: {
                                items: true,
                            },
                        },
                    },
                });

                let grossEarnings = 0;
                let totalServiceCharge = 0;

                orders.forEach((order) => {
                    order.services.forEach((service) => {
                        service.items.forEach((item) => {
                            // Use correct price based on delivery type
                            const vendorPrice = order.deliveryType === DeliveryType.EXPRESS
                                ? (item.expressVendorPriceSnapshot || item.vendorPriceSnapshot)
                                : item.vendorPriceSnapshot;

                            const platformPrice = order.deliveryType === DeliveryType.EXPRESS
                                ? (item.expressPlatformPriceSnapshot || item.expressPriceSnapshot)
                                : item.platformPriceSnapshot;

                            grossEarnings += vendorPrice * item.quantity;
                            totalServiceCharge += (platformPrice - vendorPrice) * item.quantity;
                        });
                    });
                });

                if (orders.length === 0 && grossEarnings === 0) {
                    return null;
                }

                // Calculate transfer charge from settings
                let transferCharge = 0;
                if (settings.transferChargeType === 'PERCENTAGE') {
                    transferCharge = grossEarnings * (settings.transferChargeRate / 100);
                } else {
                    transferCharge = settings.transferChargeRate;
                }

                const netEarnings = grossEarnings - transferCharge;

                return {
                    withdrawalId: withdrawal.id,
                    vendorId: laundry.vendorId,
                    laundryId: laundry.id,
                    laundryName: laundry.name,
                    isBranch,
                    mainVendorId,
                    totalOrders: orders.length,
                    grossEarnings: Math.round(grossEarnings * 100) / 100,
                    serviceCharge: Math.round(totalServiceCharge * 100) / 100,
                    transferCharge: Math.round(transferCharge * 100) / 100,
                    totalEarnings: Math.round(netEarnings * 100) / 100, // Net after transfer charge
                    orderIds: orders.map(o => o.id), // Store for marking as disbursed
                };
            }),
        );

        const validLaundries = laundryEarnings.filter((v) => v !== null);

        if (validLaundries.length === 0) {
            await this._dbService.withdrawal.delete({
                where: { id: withdrawal.id },
            });
            throw new BadRequestException('No laundries have earnings for this period');
        }

        // Store order IDs for later marking as disbursed
        const allOrderIds = validLaundries.flatMap(v => v.orderIds);

        await this._dbService.withdrawalLaundry.createMany({
            data: validLaundries.map(v => ({
                withdrawalId: v.withdrawalId,
                vendorId: v.vendorId,
                laundryId: v.laundryId,
                laundryName: v.laundryName,
                isBranch: v.isBranch,
                mainVendorId: v.mainVendorId,
                totalOrders: v.totalOrders,
                grossEarnings: v.grossEarnings,
                serviceCharge: v.serviceCharge,
                transferCharge: v.transferCharge,
                totalEarnings: v.totalEarnings,
            })),
        });

        // Link orders to this withdrawal
        await this._dbService.order.updateMany({
            where: { id: { in: allOrderIds } },
            data: { withdrawalId: withdrawal.id },
        });

        return this.getWithdrawalById(withdrawal.id);
    } catch (error) {
        console.error(error);
        if (error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException('Failed to initiate withdrawal');
    }
}
```

## 3. Update `uploadLaundryInvoice` to mark orders as disbursed

Replace the method with:

```typescript
async uploadLaundryInvoice(withdrawalLaundryId: string, invoiceMediaId: number) {
    try {
        const withdrawalLaundry = await this._dbService.withdrawalLaundry.findUnique({
            where: { id: withdrawalLaundryId },
            include: { withdrawal: true },
        });

        if (!withdrawalLaundry) throw new NotFoundException('Withdrawal laundry not found');
        if (withdrawalLaundry.withdrawal.status !== WithdrawalStatus.PENDING)
            throw new BadRequestException('Cannot upload invoice for completed withdrawal');

        // Update the withdrawal laundry with invoice
        await this._dbService.withdrawalLaundry.update({
            where: { id: withdrawalLaundryId },
            data: {
                invoiceMediaId,
                invoiceUploadedAt: new Date(),
            },
        });

        // Mark all orders for this laundry in this withdrawal as disbursed
        const now = new Date();
        await this._dbService.order.updateMany({
            where: {
                laundryId: withdrawalLaundry.laundryId,
                withdrawalId: withdrawalLaundry.withdrawalId,
            },
            data: {
                vendorEarningDisbursed: true,
                disbursedAt: now,
            },
        });

        return { message: 'Invoice uploaded and orders marked as disbursed', withdrawalLaundryId };
    } catch (error) {
        console.error(error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException('Failed to upload invoice');
    }
}
```

## 4. Update `generateLaundryEarningReport` to use configurable transfer charge

Replace lines 349-350 with:

```typescript
// Get settings for transfer charge
const settings = await this._dbService.adminSettings.findFirst();
const transferChargeType = settings?.transferChargeType || 'PERCENTAGE';
const transferChargeRate = settings?.transferChargeRate || 1.0;

// ... inside the orders.forEach loop:

// Calculate transfer charge based on settings
let transfer = 0;
if (transferChargeType === 'PERCENTAGE') {
    transfer = orderGrossEarning * (transferChargeRate / 100);
} else {
    transfer = transferChargeRate;
}
const netVendorEarning = orderGrossEarning - transfer;
```

## 5. Update WithdrawalLaundry model

Add these fields to track detailed breakdown:

```prisma
model WithdrawalLaundry {
  // ... existing fields ...

  grossEarnings   Float?  // Gross vendor earning before transfer
  serviceCharge   Float?  // Platform's service charge
  transferCharge  Float?  // Transfer fee deducted
  // totalEarnings is net (grossEarnings - transferCharge)
}
```

## 6. Update getWithdrawalById response

Add detailed breakdown in response:

```typescript
laundries: withdrawal.laundries.map((v) => ({
    id: v.laundryId,
    laundryName: v.laundryName,
    branchType: v.isBranch ? 'Sub' : 'Main',
    totalOrders: v.totalOrders,
    grossEarnings: v.grossEarnings,
    serviceCharge: v.serviceCharge,
    transferCharge: v.transferCharge,
    totalEarnings: v.totalEarnings, // Net earning
    invoiceMediaId: v.invoiceMediaId,
    invoiceUploadedAt: v.invoiceUploadedAt,
    hasInvoice: !!v.invoiceMediaId,
})),
```

## Summary of Fixes

1. **Express/Normal pricing**: Uses `expressVendorPriceSnapshot` for express orders, `vendorPriceSnapshot` for normal
2. **Service charge**: Calculated as `(platformPrice - vendorPrice) * quantity` per item
3. **Transfer charge**: Configurable (PERCENTAGE or FIXED) from AdminSettings
4. **Vendor earning**: `grossEarnings - transferCharge`
5. **Disbursement tracking**: Orders marked as `vendorEarningDisbursed = true` when invoice uploaded
