import { config } from 'dotenv';
config();

const AppConfig = {
    APP: {
        ENV: process.env.APP_ENV,
        NAME: 'API',
        PORT: Number(process.env.APP_PORT),
        DEBUG: Boolean(process.env.APP_DEBUG),
        LOG_LEVEL: Number(process.env.APP_LOG_LEVEL),
        TOKEN_EXPIRATION: Number(process.env.APP_TOKEN_EXPIRATION),
    },
    DATABASE: {
        URL: process.env.APP_DATABASE_URL,
    },
    REDIS: {
        HOST: process.env.APP_REDIS_HOST,
        PORT: Number(process.env.APP_REDIS_PORT),
    },
    AWS: {
        ACCESS_KEY: process.env.APP_AWS_ACCESS_KEY,
        SECRET_KEY: process.env.APP_AWS_SECRET_KEY,
        REGION: process.env.APP_AWS_REGION || 'us-east-1',
        BUCKET: process.env.APP_AWS_BUCKET,
        BUCKET_BASE_URL: process.env.APP_AWS_BUCKET_BASE_URL,
        STS_ROLE_ARN: process.env.APP_AWS_STS_ROLE_ARN,
    },
    TWILIO: {
        ACCOUNT_SID: process.env.APP_TWILIO_ACCOUNT_SID,
        AUTH_TOKEN: process.env.APP_TWILIO_AUTH_TOKEN,
        VERIFY_SERVICE_SID: process.env.APP_VERIFY_SERVICE_SID,
    },
    OAUTH: {
        GOOGLE: process.env.APP_GOOGLE_OAUTH_ENDPOINT,
        APPLE: process.env.APP_APPLE_OAUTH_ENDPOINT,
    },

    FIREBASE: {
        PROJECT_ID: process.env.APP_FIREBASE_PROJECT_ID,
        CLIENT_EMAIL: process.env.APP_FIREBASE_CLIENT_EMAIL,
        PRIVATE_KEY: process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
};

export default AppConfig;
