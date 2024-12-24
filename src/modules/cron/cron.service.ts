import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import DatabaseService from '../../database/database.service';
// import { LEVEL, UserType } from '@prisma/client';
// import * as moment from 'moment-timezone';

@Injectable()
export default class CronService {
    constructor(private _dbService: DatabaseService) { }

    @Cron(CronExpression.EVERY_HOUR, { name: 'test' })
    HandleTestMessage() {
        console.log("'===> Generated from test cron <===', '[CRON]'")
    }

    // @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'user-level-allocation' })
    // async HandleCustomerLevelMessage() {
    //     const users = await this._dbService.user.findMany({
    //         where: {
    //             type: UserType.USER,
    //         },
    //     });

    //     console.log("+++++++++++++++++++++++++++++++++ Cron to update user level +++++++++++++++++++++++++++++++++");
    //     console.log(`Processing ${users.length} users for level updates.`);


    //     if (users.length) {
    //         for (const user of users) {
    //             console.log(`Processing user: ${user.id}, Current Level: ${user.level}`);

    //             // Get current year start (January 1st)
    //             const currentTimeInKarachi = moment.tz('Asia/Karachi');
    //             console.log('Current Date and Time:', currentTimeInKarachi.format('YYYY-MM-DD HH:mm:ss'));
                
    //             // Get the first date of the first month of the current year
    //             const currentYearStart = currentTimeInKarachi.clone().startOf('year').format('YYYY-MM-DD HH:mm:ss');
                
    //             // Get the first date of the current month
    //             const currentMonthStart = currentTimeInKarachi.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss');
                
    //             // to locale time string
    //             const isoCYSDate = moment(currentYearStart, "YYYY-MM-DD HH:mm:ss").toISOString(true);
    //             const isoCMSDate = moment(currentMonthStart, "YYYY-MM-DD HH:mm:ss").toISOString(true);
                
    //             // const isoCMSDate = moment(currentMonthStart, "YYYY-MM-DD HH:mm:ss").toLocaleDateString();

    //             console.log('Current Year Start in ISO:', isoCYSDate);
    //             console.log('Current Month Start in ISO:', isoCMSDate);

    //             const [orderThisMonth, orderThisYear] = await Promise.all([
    //                 this._dbService.order.count({
    //                     where: {
    //                         userId: user.id,
    //                         createdAt: {
    //                             gte: isoCMSDate
    //                         }
    //                     },
    //                 }),
    //                 this._dbService.order.count({
    //                     where: {
    //                         userId: user.id,
    //                         createdAt: {
    //                             gte: isoCYSDate,
    //                         },
    //                     },
    //                 }),
    //             ]);

    //             let newLevel: LEVEL | null = null;

    //             if (orderThisYear >= 20) {
    //                 newLevel = LEVEL.ELITE;
    //             } else if (orderThisMonth >= 5) {
    //                 newLevel = LEVEL.LOYAL;
    //             } else {
    //                 newLevel = LEVEL.BASIC;
    //             }

    //             if (newLevel && user.level !== newLevel) {
    //                 // console.log(`Updating user: ${user.id}, New Level: ${newLevel}`);
    //                 await this._dbService.user.update({
    //                     where: { id: user.id },
    //                     data: { level: newLevel },
    //                 });
    //             } else {
    //                 console.log(
    //                     `No update required for user: ${user.id}. Current Level: ${user.level}, Determined Level: ${newLevel}`
    //                 );
    //             }
    //         }
    //     } else {
    //         console.log("No users to process.");
    //     }
    //     console.log("+++++++++++++++++++++++++++++++++ Updated user levels +++++++++++++++++++++++++++++++++");
    // }

    // @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, { name: 'reset-user-levels' })
    // async HandleResetCustomerLevel() {
    //     console.log("++++++++++ Cron Job: Reset User Levels Started ++++++++++");

    //     try {
    //         // Fetch only the users who need to be reset
    //         const usersToReset = await this._dbService.user.findMany({
    //             where: {
    //                 type: UserType.USER,
    //                 NOT: {
    //                     level: { in: [LEVEL.BASIC, LEVEL.ELITE] }, // Exclude BASIC and ELITE levels
    //                 },
    //             },
    //         });

    //         console.log(`Found ${usersToReset.length} users for level reset.`);

    //         // Update levels in bulk
    //         if (usersToReset.length) {
    //             const resetPromises = usersToReset.map(user =>
    //                 this._dbService.user.update({
    //                     where: { id: user.id },
    //                     data: { level: LEVEL.BASIC },
    //                 })
    //             );
    //             await Promise.all(resetPromises); // Run updates concurrently

    //             console.log(`${usersToReset.length} users' levels have been reset to BASIC.`);
    //         } else {
    //             console.log("No users required level reset.");
    //         }
    //     } catch (error) {
    //         console.error("Error during the reset user levels cron job:", error);
    //     }

    //     console.log("++++++++++ Cron Job: Reset User Levels Finished ++++++++++");
    // }

    // @Cron(CronExpression.EVERY_YEAR, { name: 'reset-user-levels-yearly' })
    // async HandleResetCustomerLevelYearly() {
    //     console.log("++++++++++ Cron Job: Yearly Reset of User Levels Started ++++++++++");

    //     try {
    //         // Update all users of type USER to BASIC
    //         const result = await this._dbService.user.updateMany({
    //             where: { type: UserType.USER },
    //             data: { level: LEVEL.BASIC },
    //         });

    //         console.log(`${result.count} users' levels have been reset to BASIC.`);
    //     } catch (error) {
    //         console.error("Error during the yearly reset user levels cron job:", error);
    //     }

    //     console.log("++++++++++ Cron Job: Yearly Reset of User Levels Finished ++++++++++");
    // }

}
