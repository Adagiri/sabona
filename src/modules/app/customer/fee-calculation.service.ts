import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import LocationService from '../location/location.service';
import { DeliveryType, OrderType } from '@prisma/client';

export interface FeeCalculationInput {
    orderType: OrderType;
    subtotal: number;
    deliveryType: DeliveryType;
    pickupLat: number;
    pickupLong: number;
    deliveryLat: number;
    deliveryLong: number;
    customServiceCharge?: number;
}

export interface FeeCalculationResult {
    subtotal: number;
    serviceCharge: number;
    deliveryFee: number;
    vatAmount: number;
    total: number;
    distance: number;
    breakdown: {
        baseDeliveryFee: number;
        distanceDeliveryFee: number;
        expressMultiplier?: number;
        serviceChargeRate: number;
        vatRate: number;
    };
}

@Injectable()
export default class FeeCalculationService {
    constructor(
        private _dbService: DatabaseService,
        private _locationService: LocationService,
    ) {}

    async calculateOrderFees(input: FeeCalculationInput): Promise<FeeCalculationResult> {
        const settings = await this.getAdminSettings();

        // Calculate distance
        const distance = this._locationService['calculateDistance'](
            input.pickupLat,
            input.pickupLong,
            input.deliveryLat,
            input.deliveryLong,
        );

        if (distance > settings.maxDeliveryDistance) {
            throw new Error(
                `Delivery distance (${distance}km) exceeds maximum allowed distance (${settings.maxDeliveryDistance}km)`,
            );
        }

        // Calculate service charge
        const serviceCharge = this.calculateServiceCharge(input, settings);

        // Calculate delivery fee
        const deliveryFee = this.calculateDeliveryFee(input, distance, settings);

        // Calculate subtotal after service charge and delivery
        const subtotalWithFees = input.subtotal + serviceCharge + deliveryFee;

        // Calculate VAT on total (including service charge and delivery)
        const vatAmount = settings.vatEnabled ? Math.round(subtotalWithFees * settings.vatRate * 100) / 100 : 0;

        const total = subtotalWithFees + vatAmount;

        return {
            subtotal: input.subtotal,
            serviceCharge,
            deliveryFee,
            vatAmount,
            total,
            distance,
            breakdown: {
                baseDeliveryFee: settings.deliveryBaseRate,
                distanceDeliveryFee: distance * settings.deliveryPerKmRate,
                expressMultiplier: input.deliveryType === 'EXPRESS' ? settings.expressMultiplier : undefined,
                serviceChargeRate:
                    settings.serviceChargeType === 'PERCENTAGE'
                        ? settings.serviceChargeRate
                        : settings.serviceChargeRate,
                vatRate: settings.vatRate,
            },
        };
    }

    private calculateServiceCharge(input: FeeCalculationInput, settings: any): number {
        // Custom orders use admin-set service charge if provided
        if (input.orderType === OrderType.CUSTOM_LAUNDRY && input.customServiceCharge) {
            return input.customServiceCharge;
        }

        // Regular service charge calculation
        const rate =
            input.orderType === OrderType.CUSTOM_LAUNDRY
                ? settings.customOrderServiceChargeRate
                : settings.serviceChargeRate;

        if (settings.serviceChargeType === 'PERCENTAGE') {
            return Math.round(input.subtotal * (rate / 100) * 100) / 100;
        } else {
            return rate; // Fixed amount
        }
    }

    private calculateDeliveryFee(input: FeeCalculationInput, distance: number, settings: any): number {
        // Check if order qualifies for free delivery
        if (input.subtotal >= settings.freeDeliveryThreshold) {
            return 0;
        }

        let deliveryFee = settings.deliveryBaseRate + distance * settings.deliveryPerKmRate;

        // Apply express multiplier if needed
        if (input.deliveryType === 'EXPRESS') {
            deliveryFee *= settings.expressMultiplier;
        }

        return Math.round(deliveryFee * 100) / 100;
    }

    private async getAdminSettings() {
        let settings = await this._dbService.adminSettings.findFirst();

        if (!settings) {
            // Create default settings if none exist
            settings = await this._dbService.adminSettings.create({
                data: {
                    vatRate: 0.15,
                    vatEnabled: true,
                    serviceChargeType: 'PERCENTAGE',
                    serviceChargeRate: 7.0,
                    customOrderServiceChargeRate: 10.0,
                    deliveryBaseRate: 5.0,
                    deliveryPerKmRate: 2.0,
                    freeDeliveryThreshold: 100.0,
                    expressMultiplier: 2.0,
                    maxDeliveryDistance: 50.0,
                },
            });
        }

        return settings;
    }
}
