import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, DeliveryType, WithdrawalStatus } from '@prisma/client';

@Injectable()
export default class FinanceService {
    constructor(private readonly _dbService: DatabaseService) {}

    async getFinanceOverview(startDate?: Date, endDate?: Date) {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        // Get all completed orders in date range
        const orders = await this._dbService.order.findMany({
            where: {
                deletedAt: null,
                status: OrderStatus.COMPLETED,
                createdAt: { gte: start, lte: end },
            },
            include: {
                services: {
                    include: {
                        items: true,
                    },
                },
            },
        });

        // Calculate detailed breakdown
        let totalRevenue = 0;
        let totalVendorEarnings = 0;
        let totalServiceCharges = 0;
        let totalDeliveryFees = 0;
        let totalVatCollected = 0;
        let totalItemRevenue = 0;

        const orderBreakdown: any[] = [];

        orders.forEach(order => {
            let orderVendorEarning = 0;
            let orderPlatformMarkup = 0;
            let orderItemTotal = 0;

            // Build item-level details with platform markup
            const itemDetails: any[] = [];

            order.services.forEach(service => {
                service.items.forEach(item => {
                    // Determine prices based on delivery type
                    const vendorPrice = order.deliveryType === DeliveryType.EXPRESS
                        ? (item.expressVendorPriceSnapshot || item.vendorPriceSnapshot)
                        : item.vendorPriceSnapshot;

                    const platformPrice = order.deliveryType === DeliveryType.EXPRESS
                        ? item.expressPlatformPriceSnapshot
                        : item.platformPriceSnapshot;

                    const platformMarkupPerUnit = platformPrice - vendorPrice;
                    const itemVendorTotal = vendorPrice * item.quantity;
                    const itemPlatformTotal = platformPrice * item.quantity;
                    const totalPlatformMarkup = platformMarkupPerUnit * item.quantity;

                    orderVendorEarning += itemVendorTotal;
                    orderPlatformMarkup += totalPlatformMarkup;
                    orderItemTotal += itemPlatformTotal;

                    itemDetails.push({
                        itemId: item.id,
                        itemName: item.name,
                        quantity: item.quantity,
                        vendorPricePerUnit: Math.round(vendorPrice * 100) / 100,
                        platformPricePerUnit: Math.round(platformPrice * 100) / 100,
                        platformMarkupPerUnit: Math.round(platformMarkupPerUnit * 100) / 100,
                        totalVendorAmount: Math.round(itemVendorTotal * 100) / 100,
                        totalPlatformAmount: Math.round(itemPlatformTotal * 100) / 100,
                        totalPlatformMarkup: Math.round(totalPlatformMarkup * 100) / 100,
                    });
                });
            });

            totalVendorEarnings += orderVendorEarning;
            totalServiceCharges += order.serviceCharge || 0;
            totalDeliveryFees += order.deliveryFee || 0;
            totalVatCollected += order.vatAmount || 0;
            totalRevenue += order.totalAmount || 0;
            totalItemRevenue += orderItemTotal;

            orderBreakdown.push({
                orderId: order.id,
                orderNumber: order.orderNumber,
                deliveryType: order.deliveryType,
                totalAmount: order.totalAmount,
                vendorEarning: Math.round(orderVendorEarning * 100) / 100,
                platformMarkup: Math.round(orderPlatformMarkup * 100) / 100,
                serviceCharge: order.serviceCharge,
                deliveryFee: order.deliveryFee,
                vatAmount: order.vatAmount,
                items: itemDetails,
                createdAt: order.createdAt,
            });
        });

        // Platform gross profit = service charges + markup on items
        const platformGrossProfit = totalItemRevenue - totalVendorEarnings + totalServiceCharges + totalDeliveryFees;

        // Get withdrawal data
        const withdrawals = await this._dbService.withdrawal.findMany({
            where: {
                deletedAt: null,
                status: WithdrawalStatus.COMPLETED,
                completedAt: { gte: start, lte: end },
            },
            include: {
                laundries: { where: { deletedAt: null } },
            },
        });

        let totalWithdrawn = 0;
        let totalTransferCharges = 0;
        withdrawals.forEach(w => {
            w.laundries.forEach(l => {
                totalWithdrawn += l.totalEarnings;
                totalTransferCharges += (l as any).transferCharge || 0;
            });
        });

        // Get pending withdrawals
        const pendingWithdrawals = await this._dbService.withdrawal.findMany({
            where: {
                deletedAt: null,
                status: WithdrawalStatus.PENDING,
            },
            include: {
                laundries: { where: { deletedAt: null } },
            },
        });

        let pendingWithdrawalAmount = 0;
        pendingWithdrawals.forEach(w => {
            w.laundries.forEach(l => {
                pendingWithdrawalAmount += l.totalEarnings;
            });
        });

        return {
            period: {
                startDate: start,
                endDate: end,
            },
            inflow: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                itemRevenue: Math.round(totalItemRevenue * 100) / 100,
                serviceCharges: Math.round(totalServiceCharges * 100) / 100,
                deliveryFees: Math.round(totalDeliveryFees * 100) / 100,
                vatCollected: Math.round(totalVatCollected * 100) / 100,
                transferCharges: Math.round(totalTransferCharges * 100) / 100,
                orderCount: orders.length,
            },
            outflow: {
                vendorEarnings: Math.round(totalVendorEarnings * 100) / 100,
                withdrawalsCompleted: Math.round(totalWithdrawn * 100) / 100,
                pendingWithdrawals: Math.round(pendingWithdrawalAmount * 100) / 100,
                withdrawalCount: withdrawals.length,
            },
            platformGains: {
                grossProfit: Math.round(platformGrossProfit * 100) / 100,
                itemMarkup: Math.round((totalItemRevenue - totalVendorEarnings) * 100) / 100,
                serviceCharges: Math.round(totalServiceCharges * 100) / 100,
                deliveryFees: Math.round(totalDeliveryFees * 100) / 100,
                transferCharges: Math.round(totalTransferCharges * 100) / 100,
                netProfit: Math.round(
                    (platformGrossProfit + totalTransferCharges - totalVatCollected) * 100
                ) / 100,
            },
            summary: {
                totalInflow: Math.round(totalRevenue * 100) / 100,
                totalOutflow: Math.round(totalWithdrawn * 100) / 100,
                netCashflow: Math.round((totalRevenue - totalWithdrawn) * 100) / 100,
                pendingPayables: Math.round((totalVendorEarnings - totalWithdrawn) * 100) / 100,
            },
            orderBreakdown,
        };
    }

    async getMonthlyFinanceReport(year?: number) {
        const targetYear = year || new Date().getFullYear();
        const monthlyData = [];

        for (let month = 0; month < 12; month++) {
            const startDate = new Date(targetYear, month, 1);
            const endDate = new Date(targetYear, month + 1, 0, 23, 59, 59);

            // Skip future months
            if (startDate > new Date()) break;

            const orders = await this._dbService.order.aggregate({
                where: {
                    deletedAt: null,
                    status: OrderStatus.COMPLETED,
                    createdAt: { gte: startDate, lte: endDate },
                },
                _sum: {
                    totalAmount: true,
                    serviceCharge: true,
                    deliveryFee: true,
                    vatAmount: true,
                },
                _count: { id: true },
            });

            const withdrawals = await this._dbService.withdrawalLaundry.aggregate({
                where: {
                    deletedAt: null,
                    withdrawal: {
                        status: WithdrawalStatus.COMPLETED,
                        completedAt: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { totalEarnings: true },
            });

            monthlyData.push({
                month: month + 1,
                monthName: startDate.toLocaleString('default', { month: 'short' }),
                year: targetYear,
                revenue: Math.round((orders._sum.totalAmount || 0) * 100) / 100,
                serviceCharges: Math.round((orders._sum.serviceCharge || 0) * 100) / 100,
                deliveryFees: Math.round((orders._sum.deliveryFee || 0) * 100) / 100,
                vatCollected: Math.round((orders._sum.vatAmount || 0) * 100) / 100,
                withdrawals: Math.round((withdrawals._sum.totalEarnings || 0) * 100) / 100,
                orderCount: orders._count.id,
            });
        }

        return monthlyData;
    }

    async getVendorEarningsReport(startDate?: Date, endDate?: Date) {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        const laundries = await this._dbService.laundry.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                vendor: {
                    select: { id: true, name: true, phone: true },
                },
            },
        });

        const vendorData = await Promise.all(
            laundries.map(async (laundry) => {
                const orders = await this._dbService.order.findMany({
                    where: {
                        laundryId: laundry.id,
                        deletedAt: null,
                        status: OrderStatus.COMPLETED,
                        createdAt: { gte: start, lte: end },
                    },
                    include: {
                        services: {
                            include: { items: true },
                        },
                    },
                });

                let totalEarning = 0;
                let disbursedEarning = 0;
                let pendingEarning = 0;

                orders.forEach(order => {
                    let orderEarning = 0;
                    order.services.forEach(service => {
                        service.items.forEach(item => {
                            const vendorPrice = order.deliveryType === DeliveryType.EXPRESS
                                ? (item.expressVendorPriceSnapshot || item.vendorPriceSnapshot)
                                : item.vendorPriceSnapshot;
                            orderEarning += vendorPrice * item.quantity;
                        });
                    });

                    totalEarning += orderEarning;
                    // TODO: Add vendorEarningDisbursed tracking after schema migration
                    pendingEarning += orderEarning;
                });

                return {
                    laundryId: laundry.id,
                    laundryName: laundry.name,
                    vendorId: laundry.vendor.id,
                    vendorName: laundry.vendor.name,
                    vendorPhone: laundry.vendor.phone,
                    orderCount: orders.length,
                    totalEarning: Math.round(totalEarning * 100) / 100,
                    disbursedEarning: Math.round(disbursedEarning * 100) / 100,
                    pendingEarning: Math.round(pendingEarning * 100) / 100,
                };
            })
        );

        return vendorData.filter(v => v.orderCount > 0).sort((a, b) => b.totalEarning - a.totalEarning);
    }

    async getDailyRevenue(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orders = await this._dbService.order.findMany({
            where: {
                deletedAt: null,
                status: OrderStatus.COMPLETED,
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
                totalAmount: true,
                serviceCharge: true,
                deliveryFee: true,
            },
        });

        const dailyData = new Map<string, { revenue: number; serviceCharges: number; deliveryFees: number; orders: number }>();

        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            const existing = dailyData.get(dateKey) || { revenue: 0, serviceCharges: 0, deliveryFees: 0, orders: 0 };
            existing.revenue += order.totalAmount || 0;
            existing.serviceCharges += order.serviceCharge || 0;
            existing.deliveryFees += order.deliveryFee || 0;
            existing.orders += 1;
            dailyData.set(dateKey, existing);
        });

        return Array.from(dailyData.entries())
            .map(([date, data]) => ({
                date,
                revenue: Math.round(data.revenue * 100) / 100,
                serviceCharges: Math.round(data.serviceCharges * 100) / 100,
                deliveryFees: Math.round(data.deliveryFees * 100) / 100,
                orders: data.orders,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}
