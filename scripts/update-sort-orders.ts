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

async function updateItemSortOrders() {
  console.log('Updating item sort orders...');

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundItems: string[] = [];

  for (const [itemName, sortOrder] of Object.entries(ITEM_SORT_ORDER_BY_NAME)) {
    const result = await prisma.laundryServiceItem.updateMany({
      where: {
        name: itemName,
        deletedAt: null,
        sortOrder: null, // Only update items that don't already have a sortOrder
      },
      data: {
        sortOrder: sortOrder,
      },
    });

    if (result.count > 0) {
      updatedCount += result.count;
      console.log(`  ✓ Updated "${itemName}" to sortOrder ${sortOrder} (${result.count} records)`);
    } else {
      // Check if item exists but already has sortOrder
      const existingCount = await prisma.laundryServiceItem.count({
        where: {
          name: itemName,
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
