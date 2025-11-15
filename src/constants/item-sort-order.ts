/**
 * Item sort order mapping for existing items
 * Used to update existing laundry service items with proper sort orders
 */

export const ITEM_SORT_ORDER_BY_NAME: Record<string, number> = {
  // Saudi Wear (1-12)
  'White Thobe': 1,
  'Colored Thobe': 2,
  "Women's Jalabiya": 3,
  'Wool Thobe': 4,
  "Children's Thobe": 5,
  'Bisht': 6,
  "Women's Abaya": 7,
  'Shemagh': 8,
  "Women's Scarf": 9,
  'Ghutra (Head Scarf)': 10,
  'Prayer Mat': 11,
  'Saudi Cap': 12,

  // Tops (13-20)
  'Vest': 13,
  'Shirt': 14,
  'T-Shirt': 15,
  'T-shirt': 15, // Alias
  'Regular Dress': 16,
  'Hoodie': 17,
  'Wedding Dress': 18,
  'Wedding dress': 18, // Alias
  'Jacket': 19,
  'Military Undershirt': 20,

  // Bottoms (21-28)
  'Joggers': 21,
  'Under Pants': 22,
  'Underpants': 22, // Alias
  'Jeans': 23,
  'Shorts': 24,
  'Skirt': 25,
  'Thobe pants': 26,
  'Thobe Pants': 26, // Alias
  'Pants': 27,
  'Jumpsuit': 28,

  // Suits / Uniforms (29-40)
  "Men's Tracksuit": 29,
  "Men's three piece suit": 30,
  "Men's Three-Piece Suit": 30, // Alias
  "Girl's school uniform": 31,
  "Girls' School Uniform": 31, // Alias
  'Military suit': 32,
  'Military Suit': 32, // Alias
  'Military Uniform': 32, // Alias
  'Medical uniform': 33,
  'Medical Uniform': 33, // Alias
  'Lab coat': 34,
  'Lab Coat': 34, // Alias
  "Men's two piece suit": 35,
  "Men's Two-Piece Suit": 35, // Alias
  "Women's Jumpsuit": 36,
  "Women's two piece suit": 37,
  "Women's Two-Piece Suit": 37, // Alias
  "Women's three piece suit": 38,
  "Women's Three-Piece Suit": 38, // Alias
  "Men's tie": 39,
  "Men's Tie": 39, // Alias
  'Coat': 40,

  // Under Wear (41-44)
  "Men's undershirt": 41,
  "Men's Undershirt": 41, // Alias
  "Women's underwear": 42,
  "Women's Underwear": 42, // Alias
  'Boxer shorts': 43,
  'Boxer Shorts': 43, // Alias
  'Socks': 44,

  // Bed & Bath (45-56)
  'Pillow covers': 45,
  'Pillow Covers': 45, // Alias
  'Bed sheets': 46,
  'Bed Sheets': 46, // Alias
  'Bathrobe': 47,
  'Towels': 48,
  'Small duvet covers': 49,
  'Small Duvet Covers': 49, // Alias
  'Large duvet covers': 50,
  'Large Duvet Covers': 50, // Alias
  'Large pillow covers': 51,
  'Large Pillow Covers': 51, // Alias
  'Large blanket': 52,
  'Large Blanket': 52, // Alias
  'Small bath Mat': 53,
  'Small Bath Mat': 53, // Alias
  'Tablecloth': 54,
  'Small blanket': 55,
  'Small Blanket': 55, // Alias
  'Sofa cover': 56,
  'Sofa Cover': 56, // Alias
};
