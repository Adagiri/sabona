import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { WithdrawalStatus, UserType, OrderStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import MediaService from '../media/media.service';

@Injectable()
export default class WithdrawalService {
    constructor(
        private readonly _dbService: DatabaseService,
        private readonly _mediaService: MediaService,
    ) {}

    async initiateWithdrawal() {
        try {
            const settings = await this._dbService.adminSettings.findFirst();

            const now = new Date();
            const startDate = settings?.lastWithdrawalTimestamp || new Date('2000-01-01');

            const laundries = await this._dbService.laundry.findMany({
                where: {
                    vendor: {
                        status: 'ACTIVE',

                        type: UserType.VENDOR,
                    },
                },
                include: {
                    vendor: {
                        select: {
                            id: true,
                            vendorRelationAsBranch: {
                                select: {
                                    mainVendorId: true,
                                },
                            },
                        },
                    },
                },
            });

            const withdrawal = await this._dbService.withdrawal.create({
                data: {
                    startDate,
                    endDate: now,
                    status: WithdrawalStatus.PENDING,
                },
            });

            const laundryEarnings = await Promise.all(
                laundries.map(async (laundry) => {
                    const isBranch = !!laundry.vendor.vendorRelationAsBranch;
                    const mainVendorId = isBranch ? laundry.vendor.vendorRelationAsBranch.mainVendorId : null;

                    const orders = await this._dbService.order.findMany({
                        where: {
                            laundryId: laundry.id,
                            status: OrderStatus.COMPLETED,
                            createdAt: {
                                gt: startDate,
                                lte: now,
                            },
                        },
                        include: {
                            services: {
                                include: {
                                    items: true,
                                },
                            },
                        },
                    });

                    let totalEarnings = 0;
                    orders.forEach((order) => {
                        order.services.forEach((service) => {
                            service.items.forEach((item) => {
                                totalEarnings += item.vendorPriceSnapshot * item.quantity;
                            });
                        });
                    });

                    if (orders.length === 0 && totalEarnings === 0) {
                        return null;
                    }

                    return {
                        withdrawalId: withdrawal.id,
                        vendorId: laundry.vendorId,
                        laundryId: laundry.id,
                        laundryName: laundry.name,
                        isBranch,
                        mainVendorId,
                        totalOrders: orders.length,
                        totalEarnings: Math.round(totalEarnings * 100) / 100,
                    };
                }),
            );

            const validLaundries = laundryEarnings.filter((v) => v !== null);

            if (validLaundries.length === 0) {
                await this._dbService.withdrawal.delete({
                    where: { id: withdrawal.id },
                });
                throw new BadRequestException('No laundries have earnings for this period');
            }

            await this._dbService.withdrawalLaundry.createMany({
                data: validLaundries,
            });

            return this.getWithdrawalById(withdrawal.id);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to initiate withdrawal');
        }
    }

    async getWithdrawals(status?: WithdrawalStatus) {
        try {
            const where: any = { deletedAt: null };
            if (status) where.status = status;

            const withdrawals = await this._dbService.withdrawal.findMany({
                where,
                include: {
                    laundries: {
                        where: { deletedAt: null },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return withdrawals.map((w) => ({
                id: w.id,
                withdrawalNumber: w.withdrawalNumber,
                status: w.status,
                startDate: w.startDate,
                endDate: w.endDate,
                completedAt: w.completedAt,
                laundryCount: w.laundries.length,
                totalAmount: w.laundries.reduce((sum, v) => sum + v.totalEarnings, 0),
                uploadedInvoices: w.laundries.filter((v) => v.invoiceUrl).length,
            }));
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to fetch withdrawals');
        }
    }

    async getWithdrawalById(id: string) {
        try {
            const withdrawal = await this._dbService.withdrawal.findUnique({
                where: { id },
                include: {
                    laundries: {
                        where: { deletedAt: null },
                        include: {
                            vendor: {
                                select: { id: true, phone: true },
                            },
                            laundry: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });

            if (!withdrawal) throw new NotFoundException('Withdrawal not found');

            return {
                id: withdrawal.id,
                withdrawalNumber: withdrawal.withdrawalNumber,
                status: withdrawal.status,
                startDate: withdrawal.startDate,
                endDate: withdrawal.endDate,
                completedAt: withdrawal.completedAt,
                laundryCount: withdrawal.laundries.length,
                totalAmount: withdrawal.laundries.reduce((sum, v) => sum + v.totalEarnings, 0),
                uploadedInvoices: withdrawal.laundries.filter((v) => v.invoiceUrl).length,
                laundries: withdrawal.laundries.map((v) => ({
                    id: v.id,
                    laundryName: v.laundryName,
                    branchType: v.isBranch ? 'Sub' : 'Main',
                    totalOrders: v.totalOrders,
                    totalEarnings: v.totalEarnings,
                    invoiceUrl: v.invoiceUrl,
                    invoiceUploadedAt: v.invoiceUploadedAt,
                    hasInvoice: !!v.invoiceUrl,
                })),
            };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to get withdrawal details');
        }
    }

    async uploadLaundryInvoice(withdrawalLaundryId: string, invoiceUrl: string) {
        try {
            const withdrawalLaundry = await this._dbService.withdrawalLaundry.findUnique({
                where: { id: withdrawalLaundryId },
                include: { withdrawal: true },
            });

            if (!withdrawalLaundry) throw new NotFoundException('Withdrawal laundry not found');
            if (withdrawalLaundry.withdrawal.status !== WithdrawalStatus.PENDING)
                throw new BadRequestException('Cannot upload invoice for completed withdrawal');

            await this._dbService.withdrawalLaundry.update({
                where: { id: withdrawalLaundryId },
                data: {
                    invoiceUrl,
                    invoiceUploadedAt: new Date(),
                },
            });

            return { message: 'Invoice uploaded successfully', withdrawalLaundryId };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to upload invoice');
        }
    }

    async completeWithdrawal(withdrawalId: string) {
        try {
            const withdrawal = await this._dbService.withdrawal.findUnique({
                where: { id: withdrawalId },
                include: { laundries: { where: { deletedAt: null } } },
            });

            if (!withdrawal) throw new NotFoundException('Withdrawal not found');
            if (withdrawal.status !== WithdrawalStatus.PENDING)
                throw new BadRequestException('Withdrawal already completed');

            const missingInvoices = withdrawal.laundries.filter((v) => !v.invoiceUrl);
            if (missingInvoices.length > 0)
                throw new BadRequestException(
                    `Cannot complete withdrawal. ${missingInvoices.length} laundries missing invoices`,
                );

            await this._dbService.$transaction(async (tx) => {
                await tx.withdrawal.update({
                    where: { id: withdrawalId },
                    data: {
                        status: WithdrawalStatus.COMPLETED,
                        completedAt: new Date(),
                    },
                });

                await tx.adminSettings.updateMany({
                    data: { lastWithdrawalTimestamp: withdrawal.endDate },
                });
            });

            return { message: 'Withdrawal completed successfully', withdrawalId };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to complete withdrawal');
        }
    }

    async generateLaundryEarningReport(withdrawalId: string, laundryId: string): Promise<Buffer> {
        try {
            const withdrawal = await this._dbService.withdrawal.findUnique({ where: { id: withdrawalId } });
            if (!withdrawal) throw new NotFoundException('Withdrawal not found');

            const withdrawalLaundry = await this._dbService.withdrawalLaundry.findFirst({
                where: { withdrawalId, laundryId },
                include: { laundry: true, vendor: true },
            });
            if (!withdrawalLaundry) throw new NotFoundException('Laundry not found in this withdrawal');

            const orders = await this._dbService.order.findMany({
                where: {
                    laundryId: withdrawalLaundry.laundryId,
                    status: OrderStatus.COMPLETED,
                    createdAt: { gt: withdrawal.startDate, lte: withdrawal.endDate },
                },
                include: {
                    services: {
                        include: { items: true, laundryService: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Vendor Earnings');

            worksheet.columns = [
                { header: 'Laundry Name', key: 'laundryName', width: 20 },
                { header: 'Branch Type', key: 'branchType', width: 12 },
                { header: 'Order Number', key: 'orderNumber', width: 15 },
                { header: 'Order Date', key: 'orderDate', width: 20 },
                { header: 'Order Amount', key: 'orderAmount', width: 15 },
                { header: 'Service Charge', key: 'serviceCharge', width: 15 },
                { header: 'Delivery Charge', key: 'deliveryCharge', width: 15 },
                { header: 'Laundry (Vendor Fee)', key: 'vendorEarning', width: 20 },
                { header: 'Service Charge', key: 'serviceChargeOrder', width: 15 },
                { header: 'Transfer', key: 'transfer', width: 12 },
            ];

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

            let totalVendorEarnings = 0;
            let totalOrderAmount = 0;
            let totalServiceCharge = 0;
            let totalDeliveryCharge = 0;

            orders.forEach((order) => {
                let orderVendorEarning = 0;
                order.services.forEach((service) => {
                    service.items.forEach((item) => {
                        orderVendorEarning += item.vendorPriceSnapshot * item.quantity;
                    });
                });

                const serviceCharge = order.serviceCharge || 0;
                const deliveryCharge = order.deliveryFee || 0;
                const orderAmount = order.totalAmount || 0;

                totalVendorEarnings += orderVendorEarning;
                totalOrderAmount += orderAmount;
                totalServiceCharge += serviceCharge;
                totalDeliveryCharge += deliveryCharge;

                worksheet.addRow({
                    laundryName: withdrawalLaundry.laundryName,
                    branchType: withdrawalLaundry.isBranch ? 'Sub' : 'Main',
                    orderNumber: order.orderNumber,
                    orderDate: order.createdAt.toISOString(),
                    orderAmount: orderAmount.toFixed(2),
                    serviceCharge: serviceCharge.toFixed(2),
                    deliveryCharge: deliveryCharge.toFixed(2),
                    vendorEarning: orderVendorEarning.toFixed(2),
                    serviceChargeOrder: serviceCharge.toFixed(2),
                    transfer: 0,
                });
            });

            const totalRow = worksheet.addRow({
                laundryName: 'TOTAL',
                branchType: '',
                orderNumber: '',
                orderDate: '',
                orderAmount: totalOrderAmount.toFixed(2),
                serviceCharge: totalServiceCharge.toFixed(2),
                deliveryCharge: totalDeliveryCharge.toFixed(2),
                vendorEarning: totalVendorEarnings.toFixed(2),
                serviceChargeOrder: totalServiceCharge.toFixed(2),
                transfer: 0,
            });

            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };

            const buffer = await workbook.xlsx.writeBuffer();
            return Buffer.from(buffer);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to generate earning report');
        }
    }

    async generateAndStoreReport(withdrawalId: string, laundryId: string) {
        try {
            const withdrawalLaundry = await this._dbService.withdrawalLaundry.findFirst({
                where: { withdrawalId, laundryId },
            });

            if (!withdrawalLaundry) throw new NotFoundException('Laundry not found in this withdrawal');
            if (withdrawalLaundry.reportUrl)
                return { message: 'Report already exists', reportUrl: withdrawalLaundry.reportUrl };

            const buffer = await this.generateLaundryEarningReport(withdrawalId, laundryId);

            const fileName = `withdrawal-${withdrawalId}-laundry-${laundryId}.xlsx`;
            const media = await this._mediaService.UploadReportToS3(buffer, fileName, 'DOCUMENT');

            await this._dbService.withdrawalLaundry.update({
                where: { id: withdrawalLaundry.id },
                data: { reportUrl: media.path, reportMediaId: media.id },
            });

            return { message: 'Report generated and stored successfully', reportUrl: media.path, mediaId: media.id };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to generate and store report');
        }
    }

    async getOrGenerateReport(withdrawalId: string, laundryId: string) {
        try {
            const withdrawalLaundry = await this._dbService.withdrawalLaundry.findFirst({
                where: { withdrawalId, laundryId },
            });

            if (!withdrawalLaundry) throw new NotFoundException('Laundry not found in this withdrawal');

            if (withdrawalLaundry.reportUrl && withdrawalLaundry.reportMediaId) {
                try {
                    const buffer = await this._mediaService.GetReportFromS3(withdrawalLaundry.reportMediaId);
                    return { buffer, fromS3: true };
                } catch (error) {
                    console.error('Failed to fetch from S3, regenerating:', error);
                }
            }

            const buffer = await this.generateLaundryEarningReport(withdrawalId, laundryId);
            return { buffer, fromS3: false };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to get or generate report');
        }
    }
}
