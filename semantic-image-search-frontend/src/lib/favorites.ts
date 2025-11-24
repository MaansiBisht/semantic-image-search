import { SearchResult } from './api';

export interface FavoriteImage {
  id: string;
  result: SearchResult;
  savedAt: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  searchedAt: string;
  resultCount: number;
}

const FAVORITES_KEY = 'semantic-search-favorites';
const RECENT_SEARCHES_KEY = 'semantic-search-recent';
const MAX_RECENT_SEARCHES = 10;
const MAX_FAVORITES = 100;

// Favorites Management
export function getFavorites(): FavoriteImage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToFavorites(result: SearchResult): void {
  if (typeof window === 'undefined') return;
  
  const favorites = getFavorites();
  const existing = favorites.find(fav => fav.result.id === result.id);
  
  if (existing) return; // Already favorited
  
  const newFavorite: FavoriteImage = {
    id: result.id || `fav-${Date.now()}`,
    result,
    savedAt: new Date().toISOString(),
  };
  
  const updatedFavorites = [newFavorite, ...favorites].slice(0, MAX_FAVORITES);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
}

export function removeFromFavorites(resultId: string): void {
  if (typeof window === 'undefined') return;
  
  const favorites = getFavorites();
  const updated = favorites.filter(fav => fav.result.id !== resultId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export function isFavorited(resultId: string): boolean {
  const favorites = getFavorites();
  return favorites.some(fav => fav.result.id === resultId);
}

// Recent Searches Management
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToRecentSearches(query: string, resultCount: number): void {
  if (typeof window === 'undefined') return;
  
  const recent = getRecentSearches();
  const existing = recent.find(search => search.query.toLowerCase() === query.toLowerCase());
  
  if (existing) {
    // Update existing search
    existing.searchedAt = new Date().toISOString();
    existing.resultCount = resultCount;
  } else {
    // Add new search
    const newSearch: RecentSearch = {
      id: `search-${Date.now()}`,
      query,
      searchedAt: new Date().toISOString(),
      resultCount,
    };
    recent.unshift(newSearch);
  }
  
  // Keep only the most recent searches
  const updated = recent.slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAVORITES_KEY);
}
