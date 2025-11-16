    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/service/:serviceId/category/:categoryId/items/reorder',
        description: 'Reorder laundry service items within a category',
        response: {},
    })
    async reorderLaundryServiceItems(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Param('categoryId') categoryId: string,
        @Body() data: { itemIds: string[] },
    ): Promise<any> {
        return await this._vendorService.reorderLaundryServiceItems(laundryId, serviceId, categoryId, data.itemIds);
    }
