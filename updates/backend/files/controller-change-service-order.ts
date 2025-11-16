    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/service/:serviceId/change-order',
        description: 'Change a single service order position',
        response: {},
    })
    async changeLaundryServiceOrder(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Body() data: { newPosition: number },
    ): Promise<any> {
        return await this._vendorService.changeLaundryServiceOrder(laundryId, serviceId, data.newPosition);
    }
