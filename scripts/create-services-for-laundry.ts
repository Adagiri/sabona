import { PrismaClient } from '@prisma/client';
import { DEFAULT_LAUNDRY_TEMPLATE, DEFAULT_SERVICES } from '../src/constants/laundry-template';

const prisma = new PrismaClient();

const LAUNDRY_ID = 'd4572630-5a45-4591-95fc-4ec8b647fdf3';

async function createServicesForLaundry() {
    console.log(`Creating services and items for laundry: ${LAUNDRY_ID}\n`);

    // Verify laundry exists
    const laundry = await prisma.laundry.findFirst({
        where: { id: LAUNDRY_ID, deletedAt: null },
    });

    if (!laundry) {
        console.error('❌ Laundry not found!');
        process.exit(1);
    }

    console.log(`✅ Laundry found: ${laundry.name}\n`);

    // Get all categories
    const categories = await prisma.laundryItemCategory.findMany({
        where: { deletedAt: null },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));
    console.log(`✅ Found ${categories.length} categories\n`);

    // Create services and items
    for (const serviceTemplate of DEFAULT_SERVICES) {
        console.log(`Creating service: ${serviceTemplate.nameLocale.en}...`);

        const service = await prisma.laundryService.create({
            data: {
                laundryId: LAUNDRY_ID,
                nameLocale: serviceTemplate.nameLocale,
                name: serviceTemplate.nameLocale.en,
                descriptionLocale: serviceTemplate.descriptionLocale,
                description: serviceTemplate.descriptionLocale.en,
                sortOrder: serviceTemplate.sortOrder,
            },
        });

        console.log(`  ✅ Service created: ${service.name} (ID: ${service.id})`);

        // Create items for this service
        const itemsToCreate = [];

        for (const [categoryName, categoryTemplate] of Object.entries(DEFAULT_LAUNDRY_TEMPLATE)) {
            const categoryId = categoryMap.get(categoryName);

            if (!categoryId) {
                console.warn(`  ⚠️  Category not found: ${categoryName}, skipping items...`);
                continue;
            }

            for (const itemTemplate of categoryTemplate.items) {
                itemsToCreate.push({
                    laundryServiceId: service.id,
                    categoryId: categoryId,
                    nameLocale: itemTemplate.nameLocale,
                    name: itemTemplate.nameLocale.en,
                    vendorPrice: itemTemplate.vendorPrice,
                    platformPrice: itemTemplate.platformPrice,
                    expressPrice: itemTemplate.expressPrice,
                    sortOrder: itemTemplate.sortOrder,
                });
            }
        }

        await prisma.laundryServiceItem.createMany({
            data: itemsToCreate,
        });

        console.log(`  ✅ Created ${itemsToCreate.length} items for ${service.name}\n`);
    }

    console.log('🎉 Successfully created all services and items!');
    console.log('\n📊 Summary:');
    console.log(`   - Laundry: ${laundry.name}`);
    console.log(`   - Services created: ${DEFAULT_SERVICES.length}`);
    console.log(
        `   - Items per service: ${Object.values(DEFAULT_LAUNDRY_TEMPLATE).reduce((sum, cat) => sum + cat.items.length, 0)}`,
    );
}

createServicesForLaundry()
    .catch((error) => {
        console.error('❌ Error creating services:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
