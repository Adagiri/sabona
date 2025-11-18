/**
 * Default laundry template with categories, items and their sort orders
 * This template is used to automatically create services and items when a new laundry is registered
 */

export interface LaundryItemTemplate {
  nameLocale: {
    en: string;
    ar: string;
  };
  vendorPrice: number;
  platformPrice: number;
  expressVendorPrice: number;
  expressPlatformPrice: number;
}

export interface CategoryTemplate {
  nameLocale: {
    en: string;
    ar: string;
  };
  sortOrder: number;
  items: LaundryItemTemplate[];
}

// Category sort order mapping
export const CATEGORY_SORT_ORDER: Record<string, number> = {
  'Saudi Wear': 1,
  'Tops': 2,
  'Bottoms': 3,
  'Suits / Uniforms': 4,
  'Under Wear': 5,
  'Bed & Bath': 6,
};

// Default laundry template with all categories and items
export const DEFAULT_LAUNDRY_TEMPLATE: Record<string, CategoryTemplate> = {
  'Saudi Wear': {
    nameLocale: {
      en: 'Saudi Wear',
      ar: ' الملابس السعودية',
    },
    sortOrder: CATEGORY_SORT_ORDER['Saudi Wear'],
    items: [
      {
        nameLocale: { en: 'White Thobe', ar: 'الثوب الابيض' },
        vendorPrice: 5,
        platformPrice: 6,
        expressVendorPrice: 6,
        expressPlatformPrice: 7.2,
      },
      {
        nameLocale: { en: 'Colored Thobe', ar: 'الثوب الملون' },
        vendorPrice: 6,
        platformPrice: 7,
        expressVendorPrice: 7,
        expressPlatformPrice: 8.17,
      },
      {
        nameLocale: { en: "Women's Jalabiya", ar: 'جلابية نسائية' },
        vendorPrice: 14,
        platformPrice: 15,
        expressVendorPrice: 15,
        expressPlatformPrice: 16.07,
      },
      {
        nameLocale: { en: 'Wool Thobe', ar: 'الثوب الصوف' },
        vendorPrice: 9,
        platformPrice: 10,
        expressVendorPrice: 10,
        expressPlatformPrice: 11.11,
      },
      {
        nameLocale: { en: "Children's Thobe", ar: 'ثوب الأطفال' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Bisht', ar: 'البشت' },
        vendorPrice: 15,
        platformPrice: 16,
        expressVendorPrice: 16,
        expressPlatformPrice: 17.07,
      },
      {
        nameLocale: { en: "Women's Abaya", ar: 'عباءة نسائية' },
        vendorPrice: 15,
        platformPrice: 16,
        expressVendorPrice: 16,
        expressPlatformPrice: 17.07,
      },
      {
        nameLocale: { en: 'Shemagh', ar: 'الشماغ' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: "Women's Scarf", ar: 'طرحة نسائية' },
        vendorPrice: 3,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 5.33,
      },
      {
        nameLocale: { en: 'Ghutra (Head Scarf)', ar: 'الغتره' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Prayer Mat', ar: 'سجادة صلاة' },
        vendorPrice: 5,
        platformPrice: 6,
        expressVendorPrice: 6,
        expressPlatformPrice: 7.2,
      },
      {
        nameLocale: { en: 'Saudi Cap', ar: 'الطاقية السعودية' },
        vendorPrice: 2,
        platformPrice: 2,
        expressVendorPrice: 2,
        expressPlatformPrice: 2,
      },
    ],
  },
  'Tops': {
    nameLocale: {
      en: 'Tops',
      ar: ' الملابس العلوية',
    },
    sortOrder: CATEGORY_SORT_ORDER['Tops'],
    items: [
      {
        nameLocale: { en: 'Vest', ar: 'صدرية' },
        vendorPrice: 5,
        platformPrice: 6,
        expressVendorPrice: 6,
        expressPlatformPrice: 7.2,
      },
      {
        nameLocale: { en: 'Shirt', ar: 'قميص' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'T-Shirt', ar: 'تيشيرت' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Regular Dress', ar: 'فستان عادي' },
        vendorPrice: 30,
        platformPrice: 31,
        expressVendorPrice: 31,
        expressPlatformPrice: 32.03,
      },
      {
        nameLocale: { en: 'Hoodie', ar: 'هودي' },
        vendorPrice: 7,
        platformPrice: 8,
        expressVendorPrice: 8,
        expressPlatformPrice: 9.14,
      },
      {
        nameLocale: { en: 'Wedding Dress', ar: 'فستان زفاف' },
        vendorPrice: 50,
        platformPrice: 55,
        expressVendorPrice: 55,
        expressPlatformPrice: 60.5,
      },
      {
        nameLocale: { en: 'Jacket', ar: 'جاكيت' },
        vendorPrice: 8,
        platformPrice: 10,
        expressVendorPrice: 10,
        expressPlatformPrice: 12.5,
      },
      {
        nameLocale: { en: 'Military Undershirt', ar: 'تيشيرت داخلي عسكري' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
    ],
  },
  'Bottoms': {
    nameLocale: {
      en: 'Bottoms',
      ar: ' الملابس السفلية',
    },
    sortOrder: CATEGORY_SORT_ORDER['Bottoms'],
    items: [
      {
        nameLocale: { en: 'Joggers', ar: 'بنطال رياضي' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Under Pants', ar: 'سروال' },
        vendorPrice: 3,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 5.33,
      },
      {
        nameLocale: { en: 'Jeans', ar: 'جينز' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Shorts', ar: 'شورت' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Skirt', ar: 'تنورة' },
        vendorPrice: 6,
        platformPrice: 7,
        expressVendorPrice: 7,
        expressPlatformPrice: 8.17,
      },
      {
        nameLocale: { en: 'Thobe pants', ar: 'بنطال الثوب' },
        vendorPrice: 3,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 5.33,
      },
      {
        nameLocale: { en: 'Pants', ar: 'بنطال' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Jumpsuit', ar: 'جمبسوت' },
        vendorPrice: 10,
        platformPrice: 12,
        expressVendorPrice: 12,
        expressPlatformPrice: 14.4,
      },
    ],
  },
  'Suits / Uniforms': {
    nameLocale: {
      en: 'Suits / Uniforms',
      ar: ' الزي الرسمي',
    },
    sortOrder: CATEGORY_SORT_ORDER['Suits / Uniforms'],
    items: [
      {
        nameLocale: { en: "Men's Tracksuit", ar: 'بدلة رياضية رجالية' },
        vendorPrice: 10,
        platformPrice: 11,
        expressVendorPrice: 11,
        expressPlatformPrice: 12.1,
      },
      {
        nameLocale: { en: "Men's three piece suit", ar: 'بدلة رجالية مكونة من ثلاث قطع' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: "Girl's school uniform", ar: 'زي مدرسي للبنات' },
        vendorPrice: 6,
        platformPrice: 7,
        expressVendorPrice: 7,
        expressPlatformPrice: 8.17,
      },
      {
        nameLocale: { en: 'Military suit', ar: 'زي عسكري' },
        vendorPrice: 5,
        platformPrice: 6,
        expressVendorPrice: 6,
        expressPlatformPrice: 7.2,
      },
      {
        nameLocale: { en: 'Medical uniform', ar: 'زي طبي' },
        vendorPrice: 7,
        platformPrice: 8,
        expressVendorPrice: 8,
        expressPlatformPrice: 9.14,
      },
      {
        nameLocale: { en: 'Lab coat', ar: 'معطف مختبر' },
        vendorPrice: 8,
        platformPrice: 9,
        expressVendorPrice: 9,
        expressPlatformPrice: 10.13,
      },
      {
        nameLocale: { en: "Men's two piece suit", ar: 'بدلة رجالية مكونة من قطعتين' },
        vendorPrice: 4,
        platformPrice: 6,
        expressVendorPrice: 6,
        expressPlatformPrice: 9,
      },
      {
        nameLocale: { en: "Women's Jumpsuit", ar: 'جمبسوت نسائي' },
        vendorPrice: 10,
        platformPrice: 11,
        expressVendorPrice: 11,
        expressPlatformPrice: 12.1,
      },
      {
        nameLocale: { en: "Women's two piece suit", ar: 'بدلة نسائية مكونة من قطعتين' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: "Women's three piece suit", ar: 'بدلة نسائية مكونة من ثلاث قطع' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: "Men's tie", ar: 'ربطة عنق رجالية' },
        vendorPrice: 3,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 5.33,
      },
      {
        nameLocale: { en: 'Coat', ar: 'معطف' },
        vendorPrice: 10,
        platformPrice: 12,
        expressVendorPrice: 12,
        expressPlatformPrice: 14.4,
      },
    ],
  },
  'Under Wear': {
    nameLocale: {
      en: 'Under Wear',
      ar: 'الملابس الداخلية',
    },
    sortOrder: CATEGORY_SORT_ORDER['Under Wear'],
    items: [
      {
        nameLocale: { en: "Men's undershirt", ar: 'تيشيرت داخلي رجالي' },
        vendorPrice: 3,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 5.33,
      },
      {
        nameLocale: { en: "Women's underwear", ar: 'ملابس داخلية نسائية' },
        vendorPrice: 4,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 4,
      },
      {
        nameLocale: { en: 'Boxer shorts', ar: 'بوكسر' },
        vendorPrice: 2.5,
        platformPrice: 3,
        expressVendorPrice: 3,
        expressPlatformPrice: 3.6,
      },
      {
        nameLocale: { en: 'Socks', ar: 'جوارب' },
        vendorPrice: 2,
        platformPrice: 3,
        expressVendorPrice: 3,
        expressPlatformPrice: 4.5,
      },
    ],
  },
  'Bed & Bath': {
    nameLocale: {
      en: 'Bed & Bath',
      ar: 'الفراش والحمام',
    },
    sortOrder: CATEGORY_SORT_ORDER['Bed & Bath'],
    items: [
      {
        nameLocale: { en: 'Pillow covers', ar: 'أغطية الوسائد' },
        vendorPrice: 3,
        platformPrice: 4,
        expressVendorPrice: 4,
        expressPlatformPrice: 5.33,
      },
      {
        nameLocale: { en: 'Bed sheets', ar: 'أغطية سرير' },
        vendorPrice: 10,
        platformPrice: 11,
        expressVendorPrice: 11,
        expressPlatformPrice: 12.1,
      },
      {
        nameLocale: { en: 'Bathrobe', ar: 'روب حمام' },
        vendorPrice: 13,
        platformPrice: 14,
        expressVendorPrice: 14,
        expressPlatformPrice: 15.08,
      },
      {
        nameLocale: { en: 'Towels', ar: 'مناشف' },
        vendorPrice: 5,
        platformPrice: 6,
        expressVendorPrice: 6,
        expressPlatformPrice: 7.2,
      },
      {
        nameLocale: { en: 'Small duvet covers', ar: 'أغطية اللحاف صغير' },
        vendorPrice: 14,
        platformPrice: 15,
        expressVendorPrice: 15,
        expressPlatformPrice: 16.07,
      },
      {
        nameLocale: { en: 'Large duvet covers', ar: 'أغطية اللحاف كبير' },
        vendorPrice: 18,
        platformPrice: 19,
        expressVendorPrice: 19,
        expressPlatformPrice: 20.06,
      },
      {
        nameLocale: { en: 'Large pillow covers', ar: 'أغطية وسائد كبيرة' },
        vendorPrice: 4,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 6.25,
      },
      {
        nameLocale: { en: 'Large blanket', ar: 'بطانية كبيرة' },
        vendorPrice: 23,
        platformPrice: 24,
        expressVendorPrice: 24,
        expressPlatformPrice: 25.04,
      },
      {
        nameLocale: { en: 'Small bath Mat', ar: 'سجادة حمام صغيرة' },
        vendorPrice: 9,
        platformPrice: 9,
        expressVendorPrice: 9,
        expressPlatformPrice: 9,
      },
      {
        nameLocale: { en: 'Tablecloth', ar: 'مفرش طاولة' },
        vendorPrice: 5,
        platformPrice: 5,
        expressVendorPrice: 5,
        expressPlatformPrice: 5,
      },
      {
        nameLocale: { en: 'Small blanket', ar: 'بطانية صغيرة' },
        vendorPrice: 15,
        platformPrice: 16,
        expressVendorPrice: 16,
        expressPlatformPrice: 17.07,
      },
      {
        nameLocale: { en: 'Sofa cover', ar: 'غطاء أريكة' },
        vendorPrice: 10,
        platformPrice: 10,
        expressVendorPrice: 10,
        expressPlatformPrice: 10,
      },
    ],
  },
};

// Default services for the laundry
export const DEFAULT_SERVICES = [
  {
    nameLocale: {
      en: 'Wash & Iron',
      ar: 'غسيل وكوي',
    },
    descriptionLocale: {
      en: 'Professional washing and ironing service',
      ar: 'خدمة غسيل وكوي احترافية',
    },
    sortOrder: 1,
  },
  {
    nameLocale: {
      en: 'Ironing',
      ar: 'كوي',
    },
    descriptionLocale: {
      en: 'Professional ironing service',
      ar: 'خدمة كوي احترافية',
    },
    sortOrder: 2,
  },
];
