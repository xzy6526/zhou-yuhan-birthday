export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'fr' | 'zh';

/**
 * Normalizes any language code or alias to one of the supported canonical locales.
 * Zero external dependencies to prevent circular dependency cycles.
 */
export const normalizeLanguage = (lang?: unknown): SupportedLanguage => {
    if (!lang) return 'en';
    const normalized = String(lang).toLowerCase().trim();
    if (['zh', 'zh-cn', 'zh-hans', 'chinese', '中文'].includes(normalized)) return 'zh';
    if (
        normalized === 'fr' ||
        normalized === 'french' ||
        normalized === 'francais' ||
        normalized === 'française' ||
        normalized === 'francaise'
    ) {
        return 'fr';
    }
    if (
        normalized === 'bn' ||
        normalized === 'bengali' ||
        normalized === 'bangla'
    ) {
        return 'bn';
    }
    if (
        normalized === 'hi' ||
        normalized === 'hindi' ||
        normalized === 'in'
    ) {
        return 'hi';
    }
    return 'en';
};
