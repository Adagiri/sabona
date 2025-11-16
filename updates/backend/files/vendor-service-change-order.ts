    // Change Single Service Order Position
    async changeLaundryServiceOrder(
        laundryId: string,
        serviceId: string,
        newPosition: number,
    ): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Get the service
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

        // Get all services for this laundry (ordered)
        const allServices = await this._dbService.laundryService.findMany({
            where: {
                laundryId: laundryId,
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        if (newPosition < 1 || newPosition > allServices.length) {
            throw new BadRequestException(`Position must be between 1 and ${allServices.length}`);
        }

        // Find current position
        const currentIndex = allServices.findIndex((s) => s.id === serviceId);
        if (currentIndex === -1) {
            throw new BadRequestException('Service not found in list');
        }

        const currentPosition = currentIndex + 1; // 1-indexed

        if (currentPosition === newPosition) {
            return {
                success: true,
                message: 'Service is already at this position',
            };
        }

        // Reorder the array
        const updatedServices = [...allServices];
        const [movedService] = updatedServices.splice(currentIndex, 1);
        updatedServices.splice(newPosition - 1, 0, movedService);

        // Update all sortOrders
        const updatePromises = updatedServices.map((svc, index) => {
            return this._dbService.laundryService.update({
                where: { id: svc.id },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: `Service moved from position ${currentPosition} to ${newPosition}`,
        };
    }

    // Change Single Item Order Position (Category-Scoped)
    async changeLaundryServiceItemOrder(
        laundryId: string,
        serviceId: string,
        categoryId: string,
        itemId: string,
        newPosition: number,
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

        // Get all items for this service + category (ordered)
        const allItems = await this._dbService.laundryServiceItem.findMany({
            where: {
                laundryServiceId: serviceId,
                categoryId: categoryId,
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        if (allItems.length === 0) {
            throw new BadRequestException('No items found for this service and category');
        }

        if (newPosition < 1 || newPosition > allItems.length) {
            throw new BadRequestException(`Position must be between 1 and ${allItems.length}`);
        }

        // Find current position
        const currentIndex = allItems.findIndex((item) => item.id === itemId);
        if (currentIndex === -1) {
            throw new BadRequestException('Item not found in this service and category');
        }

        const currentPosition = currentIndex + 1; // 1-indexed

        if (currentPosition === newPosition) {
            return {
                success: true,
                message: 'Item is already at this position',
            };
        }

        // Reorder the array
        const updatedItems = [...allItems];
        const [movedItem] = updatedItems.splice(currentIndex, 1);
        updatedItems.splice(newPosition - 1, 0, movedItem);

        // Update all sortOrders
        const updatePromises = updatedItems.map((item, index) => {
            return this._dbService.laundryServiceItem.update({
                where: { id: item.id },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: `Item moved from position ${currentPosition} to ${newPosition}`,
        };
    }
