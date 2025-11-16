import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping of incorrect names to correct template names
const ITEM_NAME_CORRECTIONS: Record<string, { correctName: string; category: string }> = {
    // Bottoms
    'Jean Pants': { correctName: 'Jeans', category: 'Bottoms' },
    Jumpsuit: { correctName: 'Jumpsuit', category: 'Bottoms' }, // Already correct, but ensure category

    // Saudi Wear
    "Women's Jalabiya": { correctName: "Women's Jalabiya", category: 'Saudi Wear' },
    "Women's Abaya": { correctName: "Women's Abaya", category: 'Saudi Wear' },
    "Children's Thobe": { correctName: "Children's Thobe", category: 'Saudi Wear' },
    "Women's Scarf": { correctName: "Women's Scarf", category: 'Saudi Wear' },

    // Suits / Uniforms
    "Men's Tie": { correctName: "Men's tie", category: 'Suits / Uniforms' },
    "Men's Three-Piece Suit": { correctName: "Men's three piece suit", category: 'Suits / Uniforms' },
    "Men's Two-Piece Suit": { correctName: "Men's two piece suit", category: 'Suits / Uniforms' },
    "Women's Two-Piece Suit": { correctName: "Women's two piece suit", category: 'Suits / Uniforms' },
    "Women's Three-Piece Suit": { correctName: "Women's three piece suit", category: 'Suits / Uniforms' },
    "Men's Tracksuit": { correctName: "Men's Tracksuit", category: 'Suits / Uniforms' },
    "Girls' School Uniform": { correctName: "Girl's school uniform", category: 'Suits / Uniforms' },
    "Women's Jumpsuit": { correctName: "Women's Jumpsuit", category: 'Suits / Uniforms' },

    // Under Wear
    "Men's Undershirt": { correctName: "Men's undershirt", category: 'Under Wear' },
    "Women's Underwear": { correctName: "Women's underwear", category: 'Under Wear' },

    // Bed & Bath
    'Duvet Covers': { correctName: 'Small duvet covers', category: 'Bed & Bath' }, // Default to small
    'Small Bath Math': { correctName: 'Small bath Mat', category: 'Bed & Bath' },
    bath: { correctName: 'Bathrobe', category: 'Bed & Bath' },

    // Items that don't exist in template - map to closest match
    'Pakistani Suit': { correctName: 'Military suit', category: 'Suits / Uniforms' },
    Blouse: { correctName: 'Shirt', category: 'Tops' },
};

async function fixItemNames() {
    console.log('Starting item name correction...\n');

    // Get all categories
    const categories = await prisma.laundryItemCategory.findMany({
        where: { deletedAt: null },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));

    let totalUpdated = 0;
    let itemsNotFound = 0;

    // Get all items
    const allItems = await prisma.laundryServiceItem.findMany({
        where: { deletedAt: null },
        include: {
            category: true,
        },
    });

    console.log(`Found ${allItems.length} items to check\n`);

    for (const item of allItems) {
        const itemName = item.name;
        const currentCategory = item.category?.name;

        // Check if item needs correction
        if (ITEM_NAME_CORRECTIONS[itemName]) {
            const { correctName, category: correctCategory } = ITEM_NAME_CORRECTIONS[itemName];
            const correctCategoryId = categoryMap.get(correctCategory);

            if (!correctCategoryId) {
                console.log(`❌ Category not found: ${correctCategory} for item ${itemName}`);
                itemsNotFound++;
                continue;
            }

            // Update item name and category if needed
            const needsUpdate = item.name !== correctName || item.category?.name !== correctCategory;

            if (needsUpdate) {
                await prisma.laundryServiceItem.update({
                    where: { id: item.id },
                    data: {
                        name: correctName,
                        categoryId: correctCategoryId,
                    },
                });

                console.log(`✅ Updated: "${itemName}" (${currentCategory}) → "${correctName}" (${correctCategory})`);
                totalUpdated++;
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total items checked: ${allItems.length}`);
    console.log(`   - Items updated: ${totalUpdated}`);
    console.log(`   - Items not found: ${itemsNotFound}`);
    console.log(`\n✨ Item name correction completed!`);
}

fixItemNames()
    .catch((error) => {
        console.error('Error fixing item names:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
