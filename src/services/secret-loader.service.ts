import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import AppConfig from 'src/configs/app.config';

export class SecretLoaderService {
    private secretsClient: SecretsManagerClient;
    private ssmClient: SSMClient;
    private loadedCount = 0;
    private environment: string;

    constructor() {
        // Auto-detect environment (only test or prod)
        this.environment = process.env.APP_ENV || process.env.NODE_ENV || 'test';

        // Validate environment
        if (!['test', 'prod'].includes(this.environment)) {
            console.log(`⚠️  Invalid environment '${this.environment}', defaulting to 'test'`);
            this.environment = 'test';
        }

        const APP_AWS_ACCESS_KEY = process.env.APP_AWS_ACCESS_KEY;
        const APP_AWS_SECRET_KEY = process.env.APP_AWS_SECRET_KEY;

        const clientConfig = {
            region: AppConfig.AWS.REGION,
            ...(APP_AWS_ACCESS_KEY && APP_AWS_SECRET_KEY
                ? {
                      credentials: {
                          accessKeyId: APP_AWS_ACCESS_KEY,
                          secretAccessKey: APP_AWS_SECRET_KEY,
                      },
                  }
                : {}),
        };

        this.secretsClient = new SecretsManagerClient(clientConfig);
        this.ssmClient = new SSMClient(clientConfig);
    }

    /**
     * Convert secret/parameter path to APP_ prefixed environment variable
     */
    private pathToEnvVar(path: string): string {
        return (
            'APP_' +
            path
                .replace(/^sabonah\/(test|prod)\//, '') // Remove sabonah/{env}/ prefix
                .replace(/\//g, '_') // Replace / with _
                .replace(/-/g, '_') // Replace - with _
                .toUpperCase()
        ); // Convert to uppercase
    }

    /**
     * Load secrets from AWS Secrets Manager
     */
    private async loadSecretsManager(): Promise<void> {
        console.log(`🔐 Loading secrets from Secrets Manager (env: ${this.environment})...`);

        try {
            // Load environment-specific secrets only
            await this.loadSecretsByPath(`sabonah/${this.environment}/`);
        } catch (error) {
            console.log(`  ⚠️  Secrets Manager error: ${error.message}`);
        }
    }

    /**
     * Load secrets by path pattern
     */
    private async loadSecretsByPath(pathPrefix: string): Promise<void> {
        // Try common secret patterns for the environment
        const commonSecrets = [
            `${pathPrefix}database`,
            `${pathPrefix}redis`,
            `${pathPrefix}twilio`,
            `${pathPrefix}firebase`,
            `${pathPrefix}oauth`,
            `${pathPrefix}paytabs`,
        ];

        for (const secretName of commonSecrets) {
            await this.loadSingleSecret(secretName);
        }
    }

    /**
     * Load a single secret and parse JSON if needed
     */
    private async loadSingleSecret(secretName: string): Promise<void> {
        try {
            const command = new GetSecretValueCommand({ SecretId: secretName });
            const response = await this.secretsClient.send(command);
            if (response.SecretString) {
                try {
                    // Try to parse as JSON first
                    const secretData = JSON.parse(response.SecretString);

                    // If it's JSON, map each key
                    for (const [key, value] of Object.entries(secretData)) {
                        const envVarName = this.pathToEnvVar(`${secretName}/${key}`);
                        process.env[envVarName] = value as string;
                        this.loadedCount++;
                    }
                } catch {
                    // If not JSON, treat as single value
                    const envVarName = this.pathToEnvVar(secretName);
                    process.env[envVarName] = response.SecretString;
                    this.loadedCount++;
                }
            }
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                console.log(`  ⚠️  ${secretName}: ${error.message}`);
            }
        }
    }

    /**
     * Load parameters from AWS Parameter Store
     */
    private async loadParameterStore(): Promise<void> {
        console.log(`📋 Loading parameters from Parameter Store (env: ${this.environment})...`);

        try {
            // Load environment-specific parameters only
            await this.loadParametersByPath(`/sabonah/${this.environment}/`);
        } catch (error) {
            console.log(`  ⚠️  Parameter Store error: ${error.message}`);
        }
    }

    /**
     * Load parameters by path
     */
    private async loadParametersByPath(path: string): Promise<void> {
        try {
            const command = new GetParametersByPathCommand({
                Path: path,
                Recursive: true,
                WithDecryption: true,
                MaxResults: 10,
            });

            const response = await this.ssmClient.send(command);

            if (response.Parameters?.length) {
                for (const param of response.Parameters) {
                    if (param.Name && param.Value) {
                        const envVarName = this.pathToEnvVar(param.Name.replace(/^\//, ''));
                        process.env[envVarName] = param.Value;
                        this.loadedCount++;
                    }
                }
            }
        } catch (error) {
            console.log(`  ⚠️  ${path}: ${error.message}`);

            // Ignore if path doesn't exist
            if (error.name !== 'ParameterNotFound') {
                throw error;
            }
        }
    }

    /**
     * Validate required secrets are present
     */
    private validateRequiredSecrets(): void {
        const requiredEnvVars = ['APP_DATABASE_URL', 'APP_REDIS_HOST'];

        const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    /**
     * Main function to load all secrets
     */
    async loadAllSecrets(): Promise<void> {
        const startTime = Date.now();
        console.log(`Loading Sabonah secrets for environment: ${this.environment}`);

        try {
            await Promise.all([this.loadSecretsManager(), this.loadParameterStore()]);
            this.validateRequiredSecrets();
            const duration = Date.now() - startTime;
            console.log(`✅ Loaded ${this.loadedCount} secrets in ${duration}ms\n`);
            // console.log('APP_DATABASE_URL: ', process.env.APP_DATABASE_URL);
        } catch (error) {
            console.error('❌ Failed to load secrets:', error.message);

            // In test environment with local setup, continue without AWS secrets
            if (this.environment === 'test' && process.env.NODE_ENV === 'development') {
                console.log('🔧 Test environment (local): continuing with .env file configuration...\n');
                return;
            }

            throw error;
        }
    }

    /**
     * Get current environment
     */
    getEnvironment(): string {
        return this.environment;
    }
}
