import { ViewMode } from '@/components/ViewModeToggle';

export interface UserPreferences {
  viewMode: ViewMode;
  resultsPerPage: number;
  theme: 'light' | 'dark' | 'system';
  autoSaveSearches: boolean;
  showColorPalettes: boolean;
  enableKeyboardShortcuts: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: {
    color?: string;
    orientation?: string;
    minScore?: number;
  };
  icon?: string;
  shortcutKey?: number; // 1-9 for Cmd+1 to Cmd+9
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

const PREFERENCES_KEY = 'semantic-search-preferences';
const SAVED_SEARCHES_KEY = 'semantic-search-saved-searches';

const DEFAULT_PREFERENCES: UserPreferences = {
  viewMode: 'grid',
  resultsPerPage: 12,
  theme: 'system',
  autoSaveSearches: true,
  showColorPalettes: true,
  enableKeyboardShortcuts: true,
};

// ============ Preferences Management ============

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  
  const current = getPreferences();
  const updated = { ...current, ...preferences };
  
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

export function resetPreferences(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(DEFAULT_PREFERENCES));
  } catch (error) {
    console.error('Failed to reset preferences:', error);
  }
}

// ============ Saved Searches Management ============

export function getSavedSearches(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>): SavedSearch {
  if (typeof window === 'undefined') return { ...search, id: '', createdAt: '', useCount: 0 };
  
  const searches = getSavedSearches();
  
  // Check if search already exists
  const existing = searches.find(s => 
    s.query === search.query && 
    JSON.stringify(s.filters) === JSON.stringify(search.filters)
  );
  
  if (existing) {
    return existing;
  }
  
  const newSearch: SavedSearch = {
    ...search,
    id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    useCount: 0,
  };
  
  const updated = [newSearch, ...searches].slice(0, 20); // Keep max 20 saved searches
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
    return newSearch;
  } catch (error) {
    console.error('Failed to save search:', error);
    return newSearch;
  }
}

export function updateSavedSearch(id: string, updates: Partial<SavedSearch>): void {
  if (typeof window === 'undefined') return;
  
  const searches = getSavedSearches();
  const index = searches.findIndex(s => s.id === id);
  
  if (index === -1) return;
  
  searches[index] = { ...searches[index], ...updates };
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error('Failed to update saved search:', error);
  }
}

export function deleteSavedSearch(id: string): void {
  if (typeof window === 'undefined') return;
  
  const searches = getSavedSearches();
  const filtered = searches.filter(s => s.id !== id);
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete saved search:', error);
  }
}

export function incrementSearchUseCount(id: string): void {
  if (typeof window === 'undefined') return;
  
  const searches = getSavedSearches();
  const search = searches.find(s => s.id === id);
  
  if (!search) return;
  
  search.useCount += 1;
  search.lastUsed = new Date().toISOString();
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error('Failed to update use count:', error);
  }
}

export function getSearchByShortcut(key: number): SavedSearch | undefined {
  const searches = getSavedSearches();
  return searches.find(s => s.shortcutKey === key);
}

export function assignShortcutKey(searchId: string, key: number): void {
  if (typeof window === 'undefined') return;
  
  const searches = getSavedSearches();
  
  // Remove shortcut from other searches
  searches.forEach(s => {
    if (s.shortcutKey === key) {
      s.shortcutKey = undefined;
    }
  });
  
  // Assign to target search
  const search = searches.find(s => s.id === searchId);
  if (search) {
    search.shortcutKey = key;
  }
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error('Failed to assign shortcut:', error);
  }
}

export function clearAllSavedSearches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SAVED_SEARCHES_KEY);
  } catch (error) {
    console.error('Failed to clear saved searches:', error);
  }
}
