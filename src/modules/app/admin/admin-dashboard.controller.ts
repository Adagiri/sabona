import { Query } from '@nestjs/common';
import { UserType } from '@prisma/client';
import { ApiController, Authorized, Get } from '../../../core/decorators';
import DashboardService from './dashboard.service';
import FinanceService from './finance.service';

@ApiController({
    path: '/admin/dashboard',
    tag: 'Admin Dashboard',
    version: '1',
})
export class AdminDashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly financeService: FinanceService,
    ) {}

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/metrics',
        description: 'Get dashboard metrics and statistics',
        response: Object,
    })
    async getDashboardMetrics() {
        return this.dashboardService.getDashboardMetrics();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/trends',
        description: 'Get order trends over time',
        response: Object,
    })
    async getOrderTrends(@Query('days') days?: string) {
        return this.dashboardService.getOrderTrends(days ? parseInt(days) : 30);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/finance/overview',
        description: 'Get finance overview with inflow/outflow',
        response: Object,
    })
    async getFinanceOverview(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.financeService.getFinanceOverview(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/finance/monthly',
        description: 'Get monthly finance report',
        response: Object,
    })
    async getMonthlyFinanceReport(@Query('year') year?: string) {
        return this.financeService.getMonthlyFinanceReport(year ? parseInt(year) : undefined);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/finance/vendor-earnings',
        description: 'Get vendor earnings report',
        response: Object,
    })
    async getVendorEarningsReport(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.financeService.getVendorEarningsReport(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/finance/daily-revenue',
        description: 'Get daily revenue breakdown',
        response: Object,
    })
    async getDailyRevenue(@Query('days') days?: string) {
        return this.financeService.getDailyRevenue(days ? parseInt(days) : 30);
    }
}
