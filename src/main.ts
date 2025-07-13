import { loadSecrets } from './load-secrets';
import { bootstrap } from './bootstrap';

async function main() {
    try {
        await loadSecrets();

        await bootstrap();
    } catch (error) {
        console.error('❌ Application startup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
