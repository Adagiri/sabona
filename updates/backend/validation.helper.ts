/**
 * Validation helpers for user data
 */

/**
 * Validates Saudi Arabian phone numbers
 * Supports formats:
 * - +966XXXXXXXXX (international format with + prefix)
 * - 966XXXXXXXXX (international format without + prefix)
 * - 05XXXXXXXX (local format)
 * - 5XXXXXXXX (local format without leading 0)
 *
 * @param phone - Phone number to validate
 * @returns boolean - True if valid Saudi phone number
 */
export function isValidSaudiPhone(phone: string): boolean {
    if (!phone) return false;

    // Remove all spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    // Saudi phone number patterns
    const patterns = [
        /^\+9665\d{8}$/,      // +966XXXXXXXXX (starts with 5)
        /^9665\d{8}$/,        // 966XXXXXXXXX (starts with 5)
        /^05\d{8}$/,          // 05XXXXXXXX
        /^5\d{8}$/,           // 5XXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(cleanPhone));
}

/**
 * Normalizes Saudi phone number to international format (+966XXXXXXXXX)
 *
 * @param phone - Phone number to normalize
 * @returns string - Normalized phone number with +966 prefix
 */
export function normalizeSaudiPhone(phone: string): string {
    if (!phone) return '';

    // Remove all spaces, dashes, and parentheses
    let cleanPhone = phone.replace(/[\s\-()]/g, '');

    // Remove + if present
    if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1);
    }

    // Convert to +966XXXXXXXXX format
    if (cleanPhone.startsWith('966')) {
        return `+${cleanPhone}`;
    } else if (cleanPhone.startsWith('05')) {
        return `+966${cleanPhone.substring(1)}`;
    } else if (cleanPhone.startsWith('5')) {
        return `+966${cleanPhone}`;
    }

    return phone; // Return original if doesn't match expected formats
}

/**
 * Validates email format
 *
 * @param email - Email address to validate
 * @returns boolean - True if valid email format
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;

    // RFC 5322 compliant email regex (simplified version)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email);
}

/**
 * Normalizes email to lowercase
 *
 * @param email - Email address to normalize
 * @returns string - Normalized email in lowercase
 */
export function normalizeEmail(email: string): string {
    if (!email) return '';
    return email.trim().toLowerCase();
}

/**
 * Validates user name
 * - Must be at least 2 characters
 * - Must be at most 100 characters
 * - Can contain letters, spaces, hyphens, and apostrophes
 *
 * @param name - Name to validate
 * @returns boolean - True if valid name
 */
export function isValidName(name: string): boolean {
    if (!name) return false;

    const trimmedName = name.trim();

    // Length check
    if (trimmedName.length < 2 || trimmedName.length > 100) {
        return false;
    }

    // Pattern check - letters, spaces, hyphens, apostrophes, and Arabic characters
    const nameRegex = /^[\p{L}\s\-']+$/u;

    return nameRegex.test(trimmedName);
}

/**
 * Formats phone number for display
 * Converts +966XXXXXXXXX to +966 XX XXX XXXX
 *
 * @param phone - Phone number to format
 * @returns string - Formatted phone number
 */
export function formatSaudiPhone(phone: string): string {
    if (!phone) return '';

    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    if (cleanPhone.startsWith('+966')) {
        const number = cleanPhone.substring(4);
        return `+966 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
    } else if (cleanPhone.startsWith('966')) {
        const number = cleanPhone.substring(3);
        return `+966 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
    } else if (cleanPhone.startsWith('05')) {
        return `+966 ${cleanPhone.substring(1, 3)} ${cleanPhone.substring(3, 6)} ${cleanPhone.substring(6)}`;
    } else if (cleanPhone.startsWith('5')) {
        return `+966 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5)}`;
    }

    return phone;
}
