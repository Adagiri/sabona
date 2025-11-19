# Deletion Protection Updates

Apply these changes to `vendor.service.ts` to add deletion protection with state-based checks.

## 1. Update `deleteLaundry` method (around line 750)

Replace the existing method with:

```typescript
async deleteLaundry(laundryId: string): Promise<LaundryMessageResponseDTO> {
    const laundry = await this._dbService.laundry.findFirst({
        where: {
            id: laundryId,
        },
    });

    if (!laundry) {
        throw new BadRequestException('Laundry does not exist');
    }

    // Check for active orders (not completed, cancelled, or rejected)
    const activeOrders = await this._dbService.order.count({
        where: {
            laundryId: laundryId,
            deletedAt: null,
            status: {
                in: ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
            },
        },
    });

    if (activeOrders > 0) {
        throw new BadRequestException(
            `Cannot delete laundry - it has ${activeOrders} active order(s). Complete or cancel them first.`
        );
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await this._dbService.withdrawalLaundry.count({
        where: {
            laundryId: laundryId,
            deletedAt: null,
            withdrawal: {
                status: 'PENDING',
            },
        },
    });

    if (pendingWithdrawals > 0) {
        throw new BadRequestException(
            `Cannot delete laundry - it has ${pendingWithdrawals} pending withdrawal(s). Complete them first.`
        );
    }

    // Cascade soft-delete: Services and their Items
    const services = await this._dbService.laundryService.findMany({
        where: {
            laundryId: laundryId,
            deletedAt: null,
        },
        select: { id: true },
    });

    const serviceIds = services.map(s => s.id);

    // Soft delete all items in these services
    if (serviceIds.length > 0) {
        await this._dbService.laundryServiceItem.deleteMany({
            where: {
                laundryServiceId: { in: serviceIds },
            },
        });
    }

    // Soft delete all services
    await this._dbService.laundryService.deleteMany({
        where: {
            laundryId: laundryId,
        },
    });

    // Soft delete the laundry
    await this._dbService.laundry.delete({
        where: {
            id: laundryId,
        },
    });

    return { message: 'Laundry Deleted Successfully' };
}
```

## 2. Update `deleteLaundryService` method (around line 895)

Replace the existing method with:

```typescript
async deleteLaundryService(laundryId: string, serviceId: string): Promise<LaundryServiceMessageResponseDTO> {
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

    // Check for active orders using this service
    const activeOrderServices = await this._dbService.orderLaundryService.count({
        where: {
            laundryServiceId: serviceId,
            order: {
                deletedAt: null,
                status: {
                    in: ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                },
            },
        },
    });

    if (activeOrderServices > 0) {
        throw new BadRequestException(
            `Cannot delete service - it is used in ${activeOrderServices} active order(s). Complete or cancel them first.`
        );
    }

    // Cascade soft-delete: Items in this service
    await this._dbService.laundryServiceItem.deleteMany({
        where: {
            laundryServiceId: serviceId,
        },
    });

    // Soft delete the service
    await this._dbService.laundryService.delete({
        where: {
            id: serviceId,
        },
    });

    return { message: 'Service Deleted Successfully' };
}
```

## 3. Update `deleteLaundryServiceItem` method (around line 1126)

Replace the existing method with:

```typescript
async deleteLaundryServiceItem(laundryId: string, serviceId: string, itemId: string): Promise<any> {
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

    const item = await this._dbService.laundryServiceItem.findFirst({
        where: {
            id: itemId,
            laundryServiceId: serviceId,
        },
    });

    if (!item) {
        throw new BadRequestException('Item does not exist');
    }

    // Check for active orders containing this item
    const activeOrderItems = await this._dbService.orderLaundryServiceItem.count({
        where: {
            laundryServiceItemId: itemId,
            orderLaundryService: {
                order: {
                    deletedAt: null,
                    status: {
                        in: ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                    },
                },
            },
        },
    });

    if (activeOrderItems > 0) {
        throw new BadRequestException(
            `Cannot delete item - it is in ${activeOrderItems} active order(s). Complete or cancel them first.`
        );
    }

    // Safe to soft delete
    await this._dbService.laundryServiceItem.delete({
        where: {
            id: itemId,
        },
    });

    return { data: { message: 'Item Deleted Successfully' } };
}
```

## 4. Update `deleteLaundryItemCategory` method (around line 1508)

Replace the existing method with:

```typescript
async deleteLaundryItemCategory(categoryId: string): Promise<LaundryItemCategoryMessageResponseDTO> {
    const category = await this._dbService.laundryItemCategory.findFirst({
        where: {
            id: categoryId,
            deletedAt: null,
        },
    });

    if (!category) {
        throw new BadRequestException('Category does not exist');
    }

    // Check if any active items are using this category
    const itemsUsingCategory = await this._dbService.laundryServiceItem.count({
        where: {
            categoryId: categoryId,
            deletedAt: null,
        },
    });

    if (itemsUsingCategory > 0) {
        throw new BadRequestException(
            `Cannot delete category - ${itemsUsingCategory} item(s) are still using it. Reassign or delete items first.`
        );
    }

    // Check for active subcategories
    const activeSubcategories = await this._dbService.laundryItemSubCategory.count({
        where: {
            categoryId: categoryId,
            deletedAt: null,
        },
    });

    if (activeSubcategories > 0) {
        throw new BadRequestException(
            `Cannot delete category - it has ${activeSubcategories} active subcategory/subcategories. Delete subcategories first.`
        );
    }

    // Safe to soft delete
    await this._dbService.laundryItemCategory.update({
        where: {
            id: categoryId,
        },
        data: {
            deletedAt: new Date(),
        },
    });

    return { message: 'Category Deleted Successfully' };
}
```

## Summary

### State-Based Checks

**Active order statuses (block deletion):**
- `PENDING_PAYMENT`
- `PENDING`
- `ACCEPTED`
- `IN_PROGRESS`
- `READY_FOR_PICKUP`

**Final order statuses (allow deletion):**
- `COMPLETED`
- `CANCELLED`
- `REJECTED`

**Withdrawal statuses:**
- `PENDING` - blocks deletion
- `COMPLETED` - allows deletion

### Cascade Deletions

- **Laundry deletion** → Soft-deletes all services → Soft-deletes all items
- **Service deletion** → Soft-deletes all items

### What's NOT Deleted (Historical Records)

- Completed/cancelled orders
- Feedbacks
- Completed withdrawals
- Order snapshots (OrderLaundryService, OrderLaundryServiceItem)
