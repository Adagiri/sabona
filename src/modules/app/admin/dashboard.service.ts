import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, DeliveryType, UserType } from '@prisma/client';

@Injectable()
export default class DashboardService {
    constructor(private readonly _dbService: DatabaseService) {}

    async getDashboardMetrics() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Execute all queries in parallel for performance
        const [
            // Order metrics
            totalOrders,
            todayOrders,
            thisWeekOrders,
            thisMonthOrders,
            completedOrders,
            cancelledOrders,
            pendingOrders,
            inProgressOrders,

            // Revenue metrics
            totalRevenue,
            todayRevenue,
            thisWeekRevenue,
            thisMonthRevenue,
            lastMonthRevenue,

            // User metrics
            totalCustomers,
            activeCustomers,
            newCustomersToday,
            newCustomersThisMonth,

            // Vendor metrics
            totalVendors,
            activeVendors,
            totalLaundries,
            activeLaundries,

            // Driver metrics
            totalDrivers,
            activeDrivers,

            // Delivery type breakdown
            normalOrders,
            expressOrders,

            // Platform earnings
            platformEarnings,

            // Top performing laundries
            topLaundries,

            // Order status distribution
            orderStatusDistribution,

            // Recent activity
            recentOrders,
        ] = await Promise.all([
            // Total orders
            this._dbService.order.count({ where: { deletedAt: null } }),
            this._dbService.order.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
            this._dbService.order.count({ where: { deletedAt: null, createdAt: { gte: thisWeekStart } } }),
            this._dbService.order.count({ where: { deletedAt: null, createdAt: { gte: thisMonthStart } } }),
            this._dbService.order.count({ where: { deletedAt: null, status: OrderStatus.COMPLETED } }),
            this._dbService.order.count({ where: { deletedAt: null, status: OrderStatus.CANCELLED } }),
            this._dbService.order.count({ where: { deletedAt: null, status: { in: [OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT] } } }),
            this._dbService.order.count({ where: { deletedAt: null, status: { in: [OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.READY_FOR_PICKUP] } } }),

            // Revenue
            this._dbService.order.aggregate({
                where: { deletedAt: null, status: OrderStatus.COMPLETED },
                _sum: { totalAmount: true },
            }),
            this._dbService.order.aggregate({
                where: { deletedAt: null, status: OrderStatus.COMPLETED, createdAt: { gte: today } },
                _sum: { totalAmount: true },
            }),
            this._dbService.order.aggregate({
                where: { deletedAt: null, status: OrderStatus.COMPLETED, createdAt: { gte: thisWeekStart } },
                _sum: { totalAmount: true },
            }),
            this._dbService.order.aggregate({
                where: { deletedAt: null, status: OrderStatus.COMPLETED, createdAt: { gte: thisMonthStart } },
                _sum: { totalAmount: true },
            }),
            this._dbService.order.aggregate({
                where: { deletedAt: null, status: OrderStatus.COMPLETED, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
                _sum: { totalAmount: true },
            }),

            // Customers
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.USER } }),
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.USER, status: 'ACTIVE' } }),
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.USER, createdAt: { gte: today } } }),
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.USER, createdAt: { gte: thisMonthStart } } }),

            // Vendors
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.VENDOR } }),
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.VENDOR, status: 'ACTIVE' } }),
            this._dbService.laundry.count({ where: { deletedAt: null } }),
            this._dbService.laundry.count({ where: { deletedAt: null } }), // Active laundries (all non-deleted)

            // Drivers
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.RIDER } }),
            this._dbService.user.count({ where: { deletedAt: null, type: UserType.RIDER, status: 'ACTIVE' } }),

            // Delivery types
            this._dbService.order.count({ where: { deletedAt: null, deliveryType: DeliveryType.NORMAL } }),
            this._dbService.order.count({ where: { deletedAt: null, deliveryType: DeliveryType.EXPRESS } }),

            // Platform earnings (sum of service charges)
            this._dbService.order.aggregate({
                where: { deletedAt: null, status: OrderStatus.COMPLETED },
                _sum: { serviceCharge: true, deliveryFee: true, vatAmount: true },
            }),

            // Top 5 laundries by order count
            this._dbService.order.groupBy({
                by: ['laundryId'],
                where: { deletedAt: null, status: OrderStatus.COMPLETED, laundryId: { not: null } },
                _count: { id: true },
                _sum: { totalAmount: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),

            // Order status distribution
            this._dbService.order.groupBy({
                by: ['status'],
                where: { deletedAt: null },
                _count: { id: true },
            }),

            // Recent orders
            this._dbService.order.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    totalAmount: true,
                    deliveryType: true,
                    createdAt: true,
                    laundry: { select: { name: true } },
                    user: { select: { name: true, phone: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);

        // Get laundry names for top laundries
        const topLaundryIds = topLaundries.map(l => l.laundryId).filter(Boolean);
        const laundryDetails = await this._dbService.laundry.findMany({
            where: { id: { in: topLaundryIds as string[] } },
            select: { id: true, name: true },
        });
        const laundryMap = new Map(laundryDetails.map(l => [l.id, l.name]));

        // Calculate growth percentages
        const thisMonthRevenueVal = thisMonthRevenue._sum.totalAmount || 0;
        const lastMonthRevenueVal = lastMonthRevenue._sum.totalAmount || 0;
        const revenueGrowth = lastMonthRevenueVal > 0
            ? ((thisMonthRevenueVal - lastMonthRevenueVal) / lastMonthRevenueVal) * 100
            : 0;

        return {
            orders: {
                total: totalOrders,
                today: todayOrders,
                thisWeek: thisWeekOrders,
                thisMonth: thisMonthOrders,
                completed: completedOrders,
                cancelled: cancelledOrders,
                pending: pendingOrders,
                inProgress: inProgressOrders,
                normalDelivery: normalOrders,
                expressDelivery: expressOrders,
                completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
                cancellationRate: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0,
            },
            revenue: {
                total: Math.round((totalRevenue._sum.totalAmount || 0) * 100) / 100,
                today: Math.round((todayRevenue._sum.totalAmount || 0) * 100) / 100,
                thisWeek: Math.round((thisWeekRevenue._sum.totalAmount || 0) * 100) / 100,
                thisMonth: Math.round(thisMonthRevenueVal * 100) / 100,
                lastMonth: Math.round(lastMonthRevenueVal * 100) / 100,
                growthPercentage: Math.round(revenueGrowth * 100) / 100,
                averageOrderValue: completedOrders > 0
                    ? Math.round(((totalRevenue._sum.totalAmount || 0) / completedOrders) * 100) / 100
                    : 0,
            },
            platformEarnings: {
                serviceCharges: Math.round((platformEarnings._sum.serviceCharge || 0) * 100) / 100,
                deliveryFees: Math.round((platformEarnings._sum.deliveryFee || 0) * 100) / 100,
                vatCollected: Math.round((platformEarnings._sum.vatAmount || 0) * 100) / 100,
                total: Math.round(
                    ((platformEarnings._sum.serviceCharge || 0) +
                    (platformEarnings._sum.deliveryFee || 0) +
                    (platformEarnings._sum.vatAmount || 0)) * 100
                ) / 100,
            },
            customers: {
                total: totalCustomers,
                active: activeCustomers,
                newToday: newCustomersToday,
                newThisMonth: newCustomersThisMonth,
            },
            vendors: {
                total: totalVendors,
                active: activeVendors,
                laundries: totalLaundries,
                activeLaundries: activeLaundries,
            },
            drivers: {
                total: totalDrivers,
                active: activeDrivers,
            },
            topLaundries: topLaundries.map(l => ({
                id: l.laundryId,
                name: laundryMap.get(l.laundryId as string) || 'Unknown',
                orderCount: l._count.id,
                revenue: Math.round((l._sum.totalAmount || 0) * 100) / 100,
            })),
            orderStatusDistribution: orderStatusDistribution.map(s => ({
                status: s.status,
                count: s._count.id,
            })),
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                totalAmount: o.totalAmount,
                deliveryType: o.deliveryType,
                customerName: o.user?.name || 'N/A',
                customerPhone: o.user?.phone || 'N/A',
                laundryName: o.laundry?.name || 'Custom Order',
                createdAt: o.createdAt,
            })),
        };
    }

    async getOrderTrends(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orders = await this._dbService.order.findMany({
            where: {
                deletedAt: null,
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
                status: true,
                totalAmount: true,
                deliveryType: true,
            },
        });

        // Group by date
        const dailyData = new Map<string, { orders: number; revenue: number; completed: number }>();

        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            const existing = dailyData.get(dateKey) || { orders: 0, revenue: 0, completed: 0 };
            existing.orders += 1;
            if (order.status === OrderStatus.COMPLETED) {
                existing.revenue += order.totalAmount || 0;
                existing.completed += 1;
            }
            dailyData.set(dateKey, existing);
        });

        return Array.from(dailyData.entries())
            .map(([date, data]) => ({
                date,
                orders: data.orders,
                revenue: Math.round(data.revenue * 100) / 100,
                completed: data.completed,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}
