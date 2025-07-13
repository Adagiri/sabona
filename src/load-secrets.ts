import { SecretLoaderService } from './services/secret-loader.service';

export async function loadSecrets() {
    try {
        console.log('Loading secrets...');
        const secretLoader = new SecretLoaderService();
        await secretLoader.loadAllSecrets();

        console.log(`🌍 Environment: ${secretLoader.getEnvironment()}`);

        // Validate that required environment variables are present
        const requiredVars = ['APP_DATABASE_URL', 'APP_REDIS_HOST'];
        const missing = requiredVars.filter((varName) => !process.env[varName]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        console.log('✅ Secrets loaded and validated successfully');
    } catch (error) {
        console.error('❌ Failed to load secrets:', error);

        // Enhanced error reporting
        if (error.message.includes('Missing required environment variables')) {
            console.error(
                '💡 Tip: Make sure your secrets are properly configured in AWS Secrets Manager and Parameter Store',
            );
            console.error('💡 For development, you can use a .env file');
            console.error('💡 Check your APP_ENV is set to "test" or "prod"');
        }

        throw error;
    }
}
