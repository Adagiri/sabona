# Deletion Protection Updates

Apply these changes to `vendor.service.ts` to add deletion protection.

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

    // Check for active orders
    const activeOrders = await this._dbService.order.count({
        where: {
            laundryId: laundryId,
            deletedAt: null,
        },
    });

    if (activeOrders > 0) {
        throw new BadRequestException(
            `Cannot delete laundry - it has ${activeOrders} order(s). Orders must be deleted first.`
        );
    }

    // Check for active services
    const activeServices = await this._dbService.laundryService.count({
        where: {
            laundryId: laundryId,
            deletedAt: null,
        },
    });

    if (activeServices > 0) {
        throw new BadRequestException(
            `Cannot delete laundry - it has ${activeServices} active service(s). Delete services first.`
        );
    }

    // Check for active feedbacks
    const activeFeedbacks = await this._dbService.feedback.count({
        where: {
            laundryId: laundryId,
            deletedAt: null,
        },
    });

    if (activeFeedbacks > 0) {
        throw new BadRequestException(
            `Cannot delete laundry - it has ${activeFeedbacks} feedback(s). Delete feedbacks first.`
        );
    }

    // Check for active withdrawals
    const activeWithdrawals = await this._dbService.withdrawalLaundry.count({
        where: {
            laundryId: laundryId,
            deletedAt: null,
        },
    });

    if (activeWithdrawals > 0) {
        throw new BadRequestException(
            `Cannot delete laundry - it has ${activeWithdrawals} withdrawal record(s). Complete withdrawals first.`
        );
    }

    // Safe to delete
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

    // Check for active items
    const activeItems = await this._dbService.laundryServiceItem.count({
        where: {
            laundryServiceId: serviceId,
            deletedAt: null,
        },
    });

    if (activeItems > 0) {
        throw new BadRequestException(
            `Cannot delete service - it has ${activeItems} active item(s). Delete items first.`
        );
    }

    // Check for order services (these don't have deletedAt)
    const orderServices = await this._dbService.orderLaundryService.count({
        where: {
            laundryServiceId: serviceId,
        },
    });

    if (orderServices > 0) {
        throw new BadRequestException(
            `Cannot delete service - it is referenced by ${orderServices} order(s).`
        );
    }

    // Safe to delete
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

    // Check for order items (these don't have deletedAt)
    const orderItems = await this._dbService.orderLaundryServiceItem.count({
        where: {
            laundryServiceItemId: itemId,
        },
    });

    if (orderItems > 0) {
        throw new BadRequestException(
            `Cannot delete item - it is referenced by ${orderItems} order(s).`
        );
    }

    // Safe to delete
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
            `Cannot delete category - ${itemsUsingCategory} item(s) are still using it.`
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

These updates ensure:
- **Laundry**: Cannot delete if it has active orders, services, feedbacks, or withdrawals
- **LaundryService**: Cannot delete if it has active items or is referenced by orders
- **LaundryServiceItem**: Cannot delete if it is referenced by orders
- **LaundryItemCategory**: Cannot delete if it has active items or subcategories

All checks ignore soft-deleted records (`deletedAt IS NOT NULL`).
