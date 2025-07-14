import { config } from 'dotenv';
config();

const AppConfig = {
    APP: {
        get ENV() {
            return process.env.APP_ENV;
        },
        get NAME() {
            return 'API';
        },
        get PORT() {
            return Number(process.env.APP_PORT);
        },
        get DEBUG() {
            return Boolean(process.env.APP_DEBUG);
        },
        get LOG_LEVEL() {
            return Number(process.env.APP_LOG_LEVEL);
        },
        get TOKEN_EXPIRATION() {
            return Number(process.env.APP_TOKEN_EXPIRATION);
        },
    },
    DATABASE: {
        get URL() {
            return process.env.APP_DATABASE_URL;
        },
    },
    REDIS: {
        get HOST() {
            return process.env.APP_REDIS_HOST;
        },
        get PORT() {
            return Number(process.env.APP_REDIS_PORT);
        },
        get AUTH_TOKEN() {
            return process.env.APP_REDIS_AUTH_TOKEN;
        },
    },
    AWS: {
        get REGION() {
            return process.env.APP_AWS_REGION || 'us-east-1';
        },
        get BUCKET() {
            return process.env.APP_AWS_BUCKET;
        },
        get BUCKET_BASE_URL() {
            return process.env.APP_AWS_BUCKET_BASE_URL;
        },
        get STS_ROLE_ARN() {
            return process.env.APP_AWS_STS_ROLE_ARN;
        },
    },
    TWILIO: {
        get ACCOUNT_SID() {
            return process.env.APP_TWILIO_ACCOUNT_SID;
        },
        get AUTH_TOKEN() {
            return process.env.APP_TWILIO_AUTH_TOKEN;
        },
        get VERIFY_SERVICE_SID() {
            return process.env.APP_TWILIO_VERIFY_SERVICE_SID;
        },
    },
    OAUTH: {
        get GOOGLE() {
            return process.env.APP_GOOGLE_OAUTH_ENDPOINT;
        },
        get APPLE() {
            return process.env.APP_APPLE_OAUTH_ENDPOINT;
        },
    },
    FIREBASE: {
        get PROJECT_ID() {
            return process.env.APP_FIREBASE_PROJECT_ID;
        },
        get CLIENT_EMAIL() {
            return process.env.APP_FIREBASE_CLIENT_EMAIL;
        },
        get PRIVATE_KEY() {
            return process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        },
    },
};

export default AppConfig;
