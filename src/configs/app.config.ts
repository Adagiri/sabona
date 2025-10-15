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
        get ADMIN_EMAILS() {
            return process.env.APP_ADMIN_EMAILS;
        },
        get ADMIN_PANEL_URL() {
            return process.env.APP_ADMIN_PANEL_URL;
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

        get SES_FROM_EMAIL() {
            return process.env.APP_AWS_SES_FROM_EMAIL;
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
        get PHONE_NUMBER() {
            return process.env.APP_TWILIO_PHONE_NUMBER;
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
    PAYTABS: {
        get PROFILE_ID() {
            return process.env.APP_PAYTABS_PROFILE_ID;
        },
        get SERVER_KEY() {
            return process.env.APP_PAYTABS_SERVER_KEY;
        },
        get BASE_URL() {
            return process.env.APP_PAYTABS_BASE_URL;
        },
    },
};

export default AppConfig;
