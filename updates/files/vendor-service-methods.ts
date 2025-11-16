    // Reorder Laundry Services
    async reorderLaundryServices(laundryId: string, serviceIds: string[]): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Verify all services belong to this laundry
        const services = await this._dbService.laundryService.findMany({
            where: {
                id: { in: serviceIds },
                laundryId: laundryId,
                deletedAt: null,
            },
        });

        if (services.length !== serviceIds.length) {
            throw new BadRequestException('Some services do not belong to this laundry');
        }

        // Update sortOrder for each service
        const updatePromises = serviceIds.map((serviceId, index) => {
            return this._dbService.laundryService.update({
                where: { id: serviceId },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: 'Services reordered successfully',
        };
    }

    // Reorder Laundry Service Items (category-scoped)
    async reorderLaundryServiceItems(
        laundryId: string,
        serviceId: string,
        categoryId: string,
        itemIds: string[],
    ): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Verify service belongs to laundry
        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
                deletedAt: null,
            },
        });

        if (!service) {
            throw new BadRequestException('Service not found or does not belong to this laundry');
        }

        // Verify category exists
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: { id: categoryId, deletedAt: null },
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        // Verify all items belong to this service + category
        const items = await this._dbService.laundryServiceItem.findMany({
            where: {
                id: { in: itemIds },
                laundryServiceId: serviceId,
                categoryId: categoryId,
                deletedAt: null,
            },
        });

        if (items.length !== itemIds.length) {
            throw new BadRequestException('Some items do not belong to this service and category');
        }

        // Update sortOrder for each item (scoped to service + category)
        const updatePromises = itemIds.map((itemId, index) => {
            return this._dbService.laundryServiceItem.update({
                where: { id: itemId },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: 'Items reordered successfully',
        };
    }
