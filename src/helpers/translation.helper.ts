/**
 * Recursively translate all fields that have a *Locale counterpart
 * Automatically handles nested objects and arrays
 */
export function translateData<T>(data: any, locale: string = 'en'): T {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map((item) => translateData(item, locale)) as any;
    }

    // Handle objects
    if (typeof data === 'object') {
        const result: any = {};
        const processedLocaleFields = new Set<string>();

        for (const [key, value] of Object.entries(data)) {
            // Check if this is a *Locale field
            if (key.endsWith('Locale')) {
                console.log("Yeaah")
                const baseField = key.replace('Locale', '');

                // If the base field exists, translate it
                if (baseField in data) {
                    const localeData = value as any;
                    // Extract translated value
                    if (localeData && typeof localeData === 'object') {
                        result[baseField] = localeData[locale] || localeData.en || data[baseField];
                    } else {
                        result[baseField] = data[baseField]; // Fallback to original
                    }

                    processedLocaleFields.add(baseField);
                    // Don't include the *Locale field in result
                    continue;
                }
            }

            // If this field has been processed via its *Locale counterpart, skip
            if (processedLocaleFields.has(key)) {
                continue;
            }

            // Recursively handle nested objects/arrays
            if (value && typeof value === 'object') {
                result[key] = translateData(value, locale);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    return data;
}
