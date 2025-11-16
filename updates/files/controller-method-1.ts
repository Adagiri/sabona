    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/services/reorder',
        description: 'Reorder laundry services',
        response: {},
    })
    async reorderLaundryServices(
        @Param('laundryId') laundryId: string,
        @Body() data: { serviceIds: string[] },
    ): Promise<any> {
        return await this._vendorService.reorderLaundryServices(laundryId, data.serviceIds);
    }
