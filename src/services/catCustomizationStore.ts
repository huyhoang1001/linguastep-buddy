import { CatCustomizationConfig, DEFAULT_CAT_CONFIG } from '../types/catTheme.ts';

const STORAGE_KEY = 'meomeo_cat_customization_v1';
let inMemoryConfig: CatCustomizationConfig = { ...DEFAULT_CAT_CONFIG };

export const catCustomizationStore = {
  getConfig(): CatCustomizationConfig {
    if (typeof window === 'undefined') {
      return { ...inMemoryConfig };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return {
          ...DEFAULT_CAT_CONFIG,
          ...JSON.parse(raw)
        };
      }
    } catch (e) {
      console.warn('Failed to load cat customization:', e);
    }
    return inMemoryConfig;
  },

  saveConfig(config: CatCustomizationConfig): void {
    inMemoryConfig = { ...config };
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      // Dispatch custom event so all mounted components react immediately
      window.dispatchEvent(new CustomEvent('meomeo:theme-changed', { detail: config }));
    } catch (e) {
      console.warn('Failed to save cat customization:', e);
    }
  }
};
