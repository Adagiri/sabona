import { Injectable, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';

import { PrismaClient } from '@prisma/client';
import { promisify } from 'util';
import AppConfig from 'src/configs/app.config';
import { APP_ENV } from 'src/constants';

const execAsync = promisify(exec);

@Injectable()
export default class DatabaseService extends PrismaClient implements OnModuleInit {
    constructor() {
        super({
            errorFormat: 'pretty',
            log: ['warn', 'error', 'info', { emit: 'event', level: 'query' }],
        });
    }

    private async runMigrations() {
        try {
            console.log('🔄 Running database migrations...');
            const { stdout } = await execAsync('npx prisma migrate deploy');

            if (stdout.includes('No pending migrations')) {
                console.log('📝 No pending migrations');
            } else {
                console.log('✅ Migrations applied successfully');
            }
        } catch (error) {
            console.error('❌ Migration error:', error);
            throw new Error(`Database migration failed: ${error.message}`);
        }
    }

    private _applySoftDeleteMiddleware() {
        /* Find Query Middleware */
        const findParams = ['find', 'findMany', 'findFirst', 'findUnique'];
        this.$use((params, next) => {
            if (findParams.includes(params.action)) {
                if (params.action === 'findUnique') {
                    params.action = 'findFirst';
                }
                if (params.action === 'findMany') {
                    if (!params.args) params.args = { where: {} };
                    if (!params.args.where) params.args['where'] = {};
                }

                if (!params.args.where.deletedAt) {
                    params.args.where['deletedAt'] = null;
                }
            }
            return next(params);
        });

        /* Update Query Middleware */
        this.$use((params, next) => {
            if (params.action === 'update') {
                params.action = 'updateMany';
                params.args.where['deletedAt'] = null;
            }

            if (params.action === 'updateMany') {
                if (!params.args.where) params.args.where = {};

                params.args.where['deletedAt'] = null;
            }
            return next(params);
        });

        /* Delete Query Middleware */
        this.$use((params, next) => {
            if (params.action === 'delete') {
                params.action = 'update';
                params.args['data'] = { deletedAt: new Date() };
            }
            if (params.action === 'deleteMany') {
                params.action = 'updateMany';

                if (!params.args.data) params.args.data = {};

                params.args.data = { deletedAt: new Date() };
            }
            return next(params);
        });

        /* Count Query Middleware */
        this.$use((params, next) => {
            if (params.action == 'count') {
                if (!params.args) params.args = { where: {} };
                if (!params.args.where.deletedAt) {
                    params.args.where['deletedAt'] = null;
                }
            }
            return next(params);
        });
    }

    async onModuleInit() {
        if (AppConfig.APP.ENV === APP_ENV.PROD) {
            await this.runMigrations();
        }

        this._applySoftDeleteMiddleware();
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
