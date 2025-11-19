import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import DashboardService from './dashboard.service';
import FinanceService from './finance.service';
import { JwtAuthGuard } from '../../../guards/jwt.guard';
import { AdminGuard } from '../../../guards/admin.guard';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly financeService: FinanceService,
    ) {}

    @Get('metrics')
    @ApiOperation({ summary: 'Get dashboard metrics and statistics' })
    async getDashboardMetrics() {
        return this.dashboardService.getDashboardMetrics();
    }

    @Get('trends')
    @ApiOperation({ summary: 'Get order trends over time' })
    async getOrderTrends(@Query('days') days?: string) {
        return this.dashboardService.getOrderTrends(days ? parseInt(days) : 30);
    }

    @Get('finance/overview')
    @ApiOperation({ summary: 'Get finance overview with inflow/outflow' })
    async getFinanceOverview(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.financeService.getFinanceOverview(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('finance/monthly')
    @ApiOperation({ summary: 'Get monthly finance report' })
    async getMonthlyFinanceReport(@Query('year') year?: string) {
        return this.financeService.getMonthlyFinanceReport(year ? parseInt(year) : undefined);
    }

    @Get('finance/vendor-earnings')
    @ApiOperation({ summary: 'Get vendor earnings report' })
    async getVendorEarningsReport(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.financeService.getVendorEarningsReport(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('finance/daily-revenue')
    @ApiOperation({ summary: 'Get daily revenue breakdown' })
    async getDailyRevenue(@Query('days') days?: string) {
        return this.financeService.getDailyRevenue(days ? parseInt(days) : 30);
    }
}
