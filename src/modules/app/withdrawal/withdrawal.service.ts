import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { WithdrawalStatus, UserType, OrderStatus, DeliveryType } from '@prisma/client';
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
            const pendingWithdrawal = await this._dbService.withdrawal.findFirst({
                where: {
                    status: WithdrawalStatus.PENDING,
                    deletedAt: null,
                },
            });

            if (pendingWithdrawal) {
                throw new BadRequestException('Cannot initiate new withdrawal. A pending withdrawal already exists.');
            }
            const settings = await this._dbService.adminSettings.findFirst();

            const now = new Date();
            const startDate = settings?.lastWithdrawalTimestamp || new Date('2025-06-01');

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
                    console.log(orders, 'orders for report');
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
                uploadedInvoices: w.laundries.filter((v) => v.invoiceMediaId).length,
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
            console.log(withdrawal);
            return {
                id: withdrawal.id,
                withdrawalNumber: withdrawal.withdrawalNumber,
                status: withdrawal.status,
                startDate: withdrawal.startDate,
                endDate: withdrawal.endDate,
                completedAt: withdrawal.completedAt,
                laundryCount: withdrawal.laundries.length,
                totalAmount: withdrawal.laundries.reduce((sum, v) => sum + v.totalEarnings, 0),
                uploadedInvoices: withdrawal.laundries.filter((v) => v.invoiceMediaId).length,
                laundries: withdrawal.laundries.map((v) => ({
                    id: v.laundryId,
                    laundryName: v.laundryName,
                    branchType: v.isBranch ? 'Sub' : 'Main',
                    totalOrders: v.totalOrders,
                    totalEarnings: v.totalEarnings,
                    invoiceMediaId: v.invoiceMediaId,
                    invoiceUploadedAt: v.invoiceUploadedAt,
                    hasInvoice: !!v.invoiceMediaId,
                })),
            };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to get withdrawal details');
        }
    }

    async uploadLaundryInvoice(withdrawalLaundryId: string, invoiceMediaId: number) {
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
                    invoiceMediaId,
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

            const missingInvoices = withdrawal.laundries.filter((v) => !v.invoiceMediaId);
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
            console.log(withdrawal.startDate, withdrawal.endDate);
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
                { header: 'Laundry', key: 'laundryName', width: 20 },
                { header: 'Branch', key: 'branchType', width: 10 },
                { header: 'Order Number', key: 'orderNumber', width: 8 },
                { header: 'Order Date', key: 'orderDate', width: 22 },
                { header: 'Delivery Type', key: 'deliveryType', width: 12 },
                { header: 'Order Amount', key: 'orderAmount', width: 12 },
                { header: 'Service Charge', key: 'serviceCharge', width: 12 },
                { header: 'Delivery Charge', key: 'deliveryCharge', width: 12 },
                { header: 'VAT Fee', key: 'vatFee', width: 12 },
                { header: 'Laundry Earning', key: 'vendorEarning', width: 12 },
                { header: 'Transfer (1%)', key: 'transfer', width: 12 },
            ];

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

            let totalVendorEarnings = 0;
            let totalOrderAmount = 0;
            let totalServiceCharge = 0;
            let totalDeliveryCharge = 0;
            let totalTransfer = 0;
            let totalVatFee = 0;

            orders.forEach((order) => {
                let orderGrossEarning = 0;
                let orderServiceCharge = 0;

                order.services.forEach((service) => {
                    service.items.forEach((item) => {
                        const vendorPrice = item.vendorPriceSnapshot;
                        const platformPrice = item.platformPriceSnapshot;
                        const expressPrice = item.expressPriceSnapshot;
                        const quantity = item.quantity;

                        orderGrossEarning += vendorPrice * quantity;

                        // Service charge based on delivery type
                        if (order.deliveryType === DeliveryType.EXPRESS) {
                            orderServiceCharge += (expressPrice - vendorPrice) * quantity;
                        } else {
                            orderServiceCharge += (platformPrice - vendorPrice) * quantity;
                        }
                    });
                });

                const deliveryCharge = order.deliveryFee || 0;
                const orderAmount = order.totalAmount || 0;
                const transfer = orderGrossEarning * 0.01; // 1% of gross earning
                const netVendorEarning = orderGrossEarning - transfer; // Deduct transfer from earning
                const vatFee = order.vatAmount || 0;

                totalVendorEarnings += netVendorEarning;
                totalOrderAmount += orderAmount;
                totalServiceCharge += orderServiceCharge;
                totalDeliveryCharge += deliveryCharge;
                totalTransfer += transfer;
                totalVatFee += vatFee;

                // Format date to Saudi timezone (Asia/Riyadh)
                const saudiDate = new Date(order.createdAt).toLocaleString('en-US', {
                    timeZone: 'Asia/Riyadh',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                });

                worksheet.addRow({
                    laundryName: withdrawalLaundry.laundryName,
                    branchType: withdrawalLaundry.isBranch ? 'Sub' : 'Main',
                    orderNumber: order.orderNumber,
                    orderDate: saudiDate,
                    deliveryType: order.deliveryType === DeliveryType.EXPRESS ? 'Express' : 'Normal',
                    orderAmount: orderAmount.toFixed(2),
                    serviceCharge: orderServiceCharge.toFixed(2),
                    deliveryCharge: deliveryCharge.toFixed(2),
                    vatFee: vatFee.toFixed(2),
                    vendorEarning: netVendorEarning.toFixed(2),
                    transfer: transfer.toFixed(2),
                });
            });

            const totalRow = worksheet.addRow({
                laundryName: 'TOTAL',
                branchType: '',
                orderNumber: '',
                orderDate: '',
                deliveryType: '',
                orderAmount: totalOrderAmount.toFixed(2),
                serviceCharge: totalServiceCharge.toFixed(2),
                deliveryCharge: totalDeliveryCharge.toFixed(2),
                vatFee: totalVatFee.toFixed(2),
                vendorEarning: totalVendorEarnings.toFixed(2),
                transfer: totalTransfer.toFixed(2),
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

            if (!withdrawalLaundry) {
                throw new NotFoundException('Laundry not found in this withdrawal');
            }

            if (withdrawalLaundry.reportUrl && withdrawalLaundry.reportMediaId) {
                try {
                    const buffer = await this._mediaService.GetReportFromS3(withdrawalLaundry.reportMediaId);
                    return { buffer, fromS3: true };
                } catch (error) {
                    console.error('Failed to fetch from S3, generating new report:', error);
                }
            }

            const buffer = await this.generateLaundryEarningReport(withdrawalId, laundryId);
            return { buffer, fromS3: false };
        } catch (error) {
            console.error('Error in getOrGenerateReport:', error);
            throw error; // ✅ Let the controller or global filter handle it
        }
    }

    async cancelWithdrawal(withdrawalId: string) {
        try {
            const withdrawal = await this._dbService.withdrawal.findUnique({
                where: { id: withdrawalId },
            });

            if (!withdrawal) throw new NotFoundException('Withdrawal not found');

            if (withdrawal.status !== WithdrawalStatus.PENDING) {
                throw new BadRequestException('Can only cancel pending withdrawals');
            }

            // Soft delete the withdrawal and all associated withdrawal laundries
            await this._dbService.$transaction(async (tx) => {
                await tx.withdrawal.delete({
                    where: { id: withdrawalId },
                });

                await tx.withdrawalLaundry.deleteMany({
                    where: { withdrawalId },
                });
            });

            return {
                message: 'Withdrawal cancelled successfully',
                withdrawalId,
            };
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to cancel withdrawal');
        }
    }

    async getWithdrawalLaundryInvoice(withdrawalLaundryId: string) {
        try {
            const withdrawalLaundry = await this._dbService.withdrawalLaundry.findUnique({
                where: { id: withdrawalLaundryId },
                include: { invoiceMedia: true },
            });

            if (!withdrawalLaundry) {
                throw new NotFoundException('Withdrawal laundry not found');
            }

            if (!withdrawalLaundry.invoiceMedia) {
                throw new NotFoundException('Invoice not found');
            }

            return {
                mediaId: withdrawalLaundry.invoiceMediaId,
                url: withdrawalLaundry.invoiceMedia.path,
            };
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get invoice');
        }
    }
}
