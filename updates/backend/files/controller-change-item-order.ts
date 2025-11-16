    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/service/:serviceId/category/:categoryId/item/:itemId/change-order',
        description: 'Change a single item order position within its category',
        response: {},
    })
    async changeLaundryServiceItemOrder(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Param('categoryId') categoryId: string,
        @Param('itemId') itemId: string,
        @Body() data: { newPosition: number },
    ): Promise<any> {
        return await this._vendorService.changeLaundryServiceItemOrder(
            laundryId,
            serviceId,
            categoryId,
            itemId,
            data.newPosition
        );
    }
