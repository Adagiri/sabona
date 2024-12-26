import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import DatabaseService from '../../database/database.service';
import { LEVEL, UserType, OrderStatus } from '@prisma/client';
import * as moment from 'moment-timezone';
import { chunk } from 'lodash';

@Injectable()
export default class CronService {
    constructor(private _dbService: DatabaseService) { }

    @Cron(CronExpression.EVERY_HOUR, { name: 'test' })
    HandleTestMessage() {
        console.log("'===> Generated from test cron <===', '[CRON]'")
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'user-level-allocation' })
    async HandleCustomerLevelMessage() {
        console.log("+++++++++++++++++++++++++++++++++ Cron to update user level +++++++++++++++++++++++++++++++++");

        // Fetch users to process
        const users = await this._dbService.user.findMany({
            where: { type: UserType.USER },
        });

        // Process users in chunks to avoid performance issues
        const userChunks = chunk(users, 50); // Process 50 users at a time

        for (const chunkedUsers of userChunks) {
            const updatePromises = chunkedUsers.map(async (user) => {
                console.log(`Processing user: ${user.id}, Current Level: ${user.level}`);

                // UTC time and date calculations
                const currentTimeUtc = moment.utc();
                const isoCYSDate = currentTimeUtc.clone().startOf('year').toISOString();
                const isoCMSDate = currentTimeUtc.clone().startOf('month').toISOString();

                // Count orders with completed status for this user
                const [orderThisMonth, orderThisYear] = await Promise.all([
                    this._dbService.order.count({
                        where: {
                            userId: user.id,
                            status: OrderStatus.COMPLETED, // Count only completed orders
                            createdAt: { gte: isoCMSDate },
                        },
                    }),
                    this._dbService.order.count({
                        where: {
                            userId: user.id,
                            status: OrderStatus.COMPLETED, // Count only completed orders
                            createdAt: { gte: isoCYSDate },
                        },
                    }),
                ]);

                // Determine the new level
                let newLevel: LEVEL | null = null;

                if (orderThisYear >= 20) {
                    newLevel = LEVEL.ELITE;
                } else if (orderThisMonth >= 5) {
                    newLevel = LEVEL.LOYAL;
                } else {
                    newLevel = LEVEL.BASIC;
                }

                // Update the user's level if it has changed
                if (newLevel && user.level !== newLevel) {
                    console.log(`Updating user: ${user.id}, New Level: ${newLevel}`);
                    await this._dbService.user.update({
                        where: { id: user.id },
                        data: { level: newLevel },
                    });
                } else {
                    console.log(
                        `No update required for user: ${user.id}. Current Level: ${user.level}, Determined Level: ${newLevel}`
                    );
                }
            });

            // Await all updates in the current chunk before moving to the next
            await Promise.all(updatePromises);
        }

        console.log("+++++++++++++++++++++++++++++++++ Updated user levels +++++++++++++++++++++++++++++++++");
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, { name: 'reset-user-levels' })
    async HandleResetCustomerLevel() {
        console.log("++++++++++ Cron Job: Reset User Levels Started ++++++++++");

        try {
            // Fetch only the users who need to be reset
            const usersToReset = await this._dbService.user.findMany({
                where: {
                    type: UserType.USER,
                    NOT: {
                        level: { in: [LEVEL.BASIC, LEVEL.ELITE] }, // Exclude BASIC and ELITE levels
                    },
                },
            });

            console.log(`Found ${usersToReset.length} users for level reset.`);

            // Process users in chunks to avoid performance issues
            const userChunks = chunk(usersToReset, 50); // Process 50 users at a time

            for (const chunkedUsers of userChunks) {
                const resetPromises = chunkedUsers.map(user =>
                    this._dbService.user.update({
                        where: { id: user.id },
                        data: { level: LEVEL.BASIC },
                    })
                );
                await Promise.all(resetPromises); // Run updates concurrently

                console.log(`${chunkedUsers.length} users' levels have been reset to BASIC.`);
            }
        } catch (error) {
            console.error("Error during the reset user levels cron job:", error);
        }

        console.log("++++++++++ Cron Job: Reset User Levels Finished ++++++++++");
    }

    @Cron(CronExpression.EVERY_YEAR, { name: 'reset-user-levels-yearly' })
    async HandleResetCustomerLevelYearly() {
        console.log("++++++++++ Cron Job: Yearly Reset of User Levels Started ++++++++++");

        try {
            // Fetch all users of type USER to reset
            const usersToReset = await this._dbService.user.findMany({
                where: { type: UserType.USER },
            });

            console.log(`Found ${usersToReset.length} users for yearly level reset.`);

            // Process users in chunks to avoid performance issues
            const userChunks = chunk(usersToReset, 50); // Process 50 users at a time

            for (const chunkedUsers of userChunks) {
                const resetPromises = chunkedUsers.map(user =>
                    this._dbService.user.update({
                        where: { id: user.id },
                        data: { level: LEVEL.BASIC },
                    })
                );
                await Promise.all(resetPromises); // Run updates concurrently

                console.log(`${chunkedUsers.length} users' levels have been reset to BASIC.`);
            }
        } catch (error) {
            console.error("Error during the yearly reset user levels cron job:", error);
        }

        console.log("++++++++++ Cron Job: Yearly Reset of User Levels Finished ++++++++++");
    }
}
