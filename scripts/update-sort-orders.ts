/**
 * Script to update existing items and categories with sort orders
 * Run this script to migrate existing data after adding sortOrder fields
 *
 * Usage:
 *   npx ts-node scripts/update-sort-orders.ts
 */

import { PrismaClient } from '@prisma/client';
import { CATEGORY_SORT_ORDER } from '../src/constants/laundry-template';
import { ITEM_SORT_ORDER_BY_NAME } from '../src/constants/item-sort-order';

const prisma = new PrismaClient();

async function updateCategorySortOrders() {
  console.log('Updating category sort orders...');

  for (const [categoryName, sortOrder] of Object.entries(CATEGORY_SORT_ORDER)) {
    const result = await prisma.laundryItemCategory.updateMany({
      where: {
        name: categoryName,
        deletedAt: null,
      },
      data: {
        sortOrder: sortOrder,
      },
    });

    console.log(`  ✓ Updated "${categoryName}" to sortOrder ${sortOrder} (${result.count} records)`);
  }

  console.log('Category sort orders updated successfully!\n');
}

async function updateServiceSortOrders() {
  console.log('Updating service sort orders...');

  // Update "Wash & Iron" services to sortOrder 1
  const washIronResult = await prisma.$executeRaw`
    UPDATE "LaundryService"
    SET "sortOrder" = 1
    WHERE (LOWER("name") LIKE '%wash%' AND LOWER("name") LIKE '%iron%')
      AND "deletedAt" IS NULL
      AND "sortOrder" IS NULL
  `;
  console.log(`  ✓ Updated "Wash & Iron" services to sortOrder 1 (${washIronResult} records)`);

  // Update "Ironing" (only) services to sortOrder 2
  const ironingResult = await prisma.$executeRaw`
    UPDATE "LaundryService"
    SET "sortOrder" = 2
    WHERE (LOWER("name") LIKE '%iron%' OR LOWER("name") LIKE '%كوي%')
      AND "deletedAt" IS NULL
      AND "sortOrder" IS NULL
  `;
  console.log(`  ✓ Updated "Ironing" services to sortOrder 2 (${ironingResult} records)`);

  console.log('Service sort orders updated successfully!\n');
}

async function updateItemSortOrders() {
  console.log('Updating item sort orders...');

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundItems: string[] = [];

  for (const [itemName, sortOrder] of Object.entries(ITEM_SORT_ORDER_BY_NAME)) {
    // Try exact match first
    let result = await prisma.laundryServiceItem.updateMany({
      where: {
        name: itemName,
        deletedAt: null,
        sortOrder: null, // Only update items that don't already have a sortOrder
      },
      data: {
        sortOrder: sortOrder,
      },
    });

    // If no exact match, try case-insensitive match
    if (result.count === 0) {
      result = await prisma.$executeRaw`
        UPDATE "LaundryServiceItem"
        SET "sortOrder" = ${sortOrder}
        WHERE LOWER("name") = LOWER(${itemName})
          AND "deletedAt" IS NULL
          AND "sortOrder" IS NULL
      `;
    }

    if (result.count > 0) {
      updatedCount += result.count;
      console.log(`  ✓ Updated "${itemName}" to sortOrder ${sortOrder} (${result.count} records)`);
    } else {
      // Check if item exists but already has sortOrder
      const existingCount = await prisma.laundryServiceItem.count({
        where: {
          OR: [
            { name: itemName },
            { name: { equals: itemName, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });

      if (existingCount === 0) {
        notFoundItems.push(itemName);
        notFoundCount++;
      }
    }
  }

  console.log(`\nItem sort orders updated successfully!`);
  console.log(`  Total items updated: ${updatedCount}`);

  if (notFoundCount > 0) {
    console.log(`  Items not found in database: ${notFoundCount}`);
    console.log(`  (This is normal if these items don't exist yet)`);
  }
}

async function updateItemsWithoutMapping() {
  console.log('\nChecking for items without sort orders...');

  const itemsWithoutSortOrder = await prisma.laundryServiceItem.findMany({
    where: {
      sortOrder: null,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (itemsWithoutSortOrder.length > 0) {
    console.log(`  ⚠ Found ${itemsWithoutSortOrder.length} items without sort orders:`);

    itemsWithoutSortOrder.forEach((item) => {
      console.log(`    - "${item.name}" (Category: ${item.category?.name || 'N/A'})`);
    });

    console.log(`\n  These items need to be manually assigned sort orders or added to the mapping.`);
  } else {
    console.log(`  ✓ All items have sort orders!`);
  }
}

async function main() {
  console.log('========================================');
  console.log('  Sort Order Migration Script');
  console.log('========================================\n');

  try {
    await updateCategorySortOrders();
    await updateServiceSortOrders();
    await updateItemSortOrders();
    await updateItemsWithoutMapping();

    console.log('\n========================================');
    console.log('  Migration completed successfully!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
