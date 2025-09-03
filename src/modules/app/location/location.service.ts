import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { UserType } from '@prisma/client';

interface DriverWithDistance {
    riderId: string;
    firstName: string;
    lastName: string;
    phone: string;
    lat: number;
    long: number;
    distance: number; // in kilometers
}

@Injectable()
export default class LocationService {
    constructor(private _dbService: DatabaseService) {}

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param lat1 Latitude of point 1
     * @param lon1 Longitude of point 1
     * @param lat2 Latitude of point 2
     * @param lon2 Longitude of point 2
     * @returns Distance in kilometers
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Find closest available driver to a pickup location
     * @param pickupLat Pickup latitude
     * @param pickupLong Pickup longitude
     * @param maxDistanceKm Maximum distance in kilometers (optional)
     * @returns Closest driver or null if none found
     */
    async findClosestAvailableDriver(
        pickupLat: number,
        pickupLong: number,
        maxDistanceKm: number = 500,
    ): Promise<DriverWithDistance | null> {
        // Get all active riders with their current locations
        const availableRiders = await this._dbService.user.findMany({
            where: {
                type: UserType.RIDER,
                status: 'ACTIVE',
                location: {
                    isNot: null, // Has location data
                },
            },
            include: {
                location: true,
                RiderOrder: {
                    where: {
                        deletedAt: null, // Only active assignments
                        order: {
                            status: {
                                in: ['ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'], // Busy statuses
                            },
                        },
                    },
                },
            },
        });

        // Filter out busy drivers and calculate distances
        const availableDriversWithDistance: DriverWithDistance[] = [];

        for (const rider of availableRiders) {
            // Skip if driver is currently busy
            // if (rider.RiderOrder.length > 0) {
            //     continue;
            // }

            const distance = this.calculateDistance(pickupLat, pickupLong, rider.location!.lat, rider.location!.long);

            // Skip if driver is too far
            if (distance > maxDistanceKm) {
                continue;
            }

            availableDriversWithDistance.push({
                riderId: rider.id,
                firstName: rider.firstName,
                lastName: rider.lastName,
                phone: rider.phone,
                lat: rider.location!.lat,
                long: rider.location!.long,
                distance,
            });
        }

        // Sort by distance and return closest
        if (availableDriversWithDistance.length === 0) {
            return null;
        }

        availableDriversWithDistance.sort((a, b) => a.distance - b.distance);
        return availableDriversWithDistance[0];
    }

    /**
     * Update driver's current location
     * @param riderId Driver's user ID
     * @param lat Current latitude
     * @param long Current longitude
     */
    async updateDriverLocation(riderId: string, lat: number, long: number): Promise<void> {
        await this._dbService.userLocation.upsert({
            where: { userId: riderId },
            update: {
                lat,
                long,
                updatedAt: new Date(),
            },
            create: {
                userId: riderId,
                lat,
                long,
            },
        });
    }

    /**
     * Get all drivers within radius of a location
     * @param lat Center latitude
     * @param long Center longitude
     * @param radiusKm Radius in kilometers
     * @returns Array of drivers within radius
     */
    async getDriversWithinRadius(lat: number, long: number, radiusKm: number = 20): Promise<DriverWithDistance[]> {
        const allRiders = await this._dbService.user.findMany({
            where: {
                type: UserType.RIDER,
                status: 'ACTIVE',
                location: { isNot: null },
            },
            include: { location: true },
        });

        const driversInRadius: DriverWithDistance[] = [];

        for (const rider of allRiders) {
            const distance = this.calculateDistance(lat, long, rider.location!.lat, rider.location!.long);

            if (distance <= radiusKm) {
                driversInRadius.push({
                    riderId: rider.id,
                    firstName: rider.firstName,
                    lastName: rider.lastName,
                    phone: rider.phone,
                    lat: rider.location!.lat,
                    long: rider.location!.long,
                    distance,
                });
            }
        }

        return driversInRadius.sort((a, b) => a.distance - b.distance);
    }
}
