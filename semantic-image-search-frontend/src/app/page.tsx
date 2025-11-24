'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Search as SearchIcon, BarChart3, Settings, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar, SearchOptions } from '@/components/SearchBar';
import { EnhancedResultsGrid } from '@/components/EnhancedResultsGridV2';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { SettingsModal } from '@/components/SettingsModal';
import { QuickSearchDropdown } from '@/components/QuickSearchDropdown';
import { SaveSearchDialog } from '@/components/SaveSearchDialog';
import { FiltersPanel } from '@/components/FiltersPanel';
import { apiClient, SearchResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { addToRecentSearches } from '@/lib/favorites';
import { getPreferences, UserPreferences, SavedSearch, incrementSearchUseCount, getSearchByShortcut } from '@/lib/preferences';

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());

  // Load preferences on mount
  useEffect(() => {
    const prefs = getPreferences();
    setPreferences(prefs);
    setViewMode(prefs.viewMode);
  }, []);

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Keyboard shortcuts for saved searches
  useEffect(() => {
    if (!preferences.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 1-9 for quick searches
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const keyNum = parseInt(e.key);
        const search = getSearchByShortcut(keyNum);
        if (search) {
          handleSavedSearchSelect(search);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.enableKeyboardShortcuts]);

  const checkConnection = async () => {
    try {
      await apiClient.healthCheck();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      console.error('Backend connection failed:', error);
    }
  };

  const handleSearch = async (query: string, options: SearchOptions) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);
    setCurrentFilters(options);

    try {
      let response;
      
      // If file is uploaded, use upload-search endpoint
      if (options.uploadedFile) {
        response = await apiClient.uploadImageSearch(options.uploadedFile, {
          query: query || undefined,
          top_k: options.topK,
          min_score: options.minScore,
        });
      } else {
        // Otherwise use regular search endpoint
        response = await apiClient.search({
          query,
          mode: options.mode,
          image_url: options.imageUrl,
          ingest: options.ingest,
          top_k: options.topK,
          per_page: options.perPage,
          min_score: options.minScore,
          color: options.color,
          orientation: options.orientation,
          date_from: options.dateFrom,
          date_to: options.dateTo,
          use_advanced_scoring: options.useAdvancedScoring,
          image_weight: options.imageWeight,
          text_weight: options.textWeight,
          metadata_weight: options.metadataWeight,
        });
      }

      setResults(response.results);
      
      // Add to recent searches
      const searchQuery = query || (options.uploadedFile ? `Image: ${options.uploadedFile.name}` : 'Search');
      addToRecentSearches(searchQuery, response.results.length);
      
      // Show ingestion feedback if new images were fetched
      if (options.ingest && response.ingested.length > 0) {
        console.log(`Ingested ${response.ingested.length} new images`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    handleSearch(category, { 
      ingest: false, 
      topK: 8, 
      perPage: 10, 
      minScore: 0.20, 
      mode: 'text',
      useAdvancedScoring: false,
      imageWeight: 0.6,
      textWeight: 0.2,
      metadataWeight: 0.2
    });
    setShowFilters(false);
  };

  const handleAnalyticsSearchSelect = (query: string) => {
    setShowAnalytics(false);
    handleSearch(query, { 
      ingest: false, 
      topK: 8, 
      perPage: 10, 
      minScore: 0.20, 
      mode: 'text',
      useAdvancedScoring: false,
      imageWeight: 0.6,
      textWeight: 0.2,
      metadataWeight: 0.2
    });
  };

  const handleColorSearch = (color: string) => {
    handleSearch('', { 
      ingest: false, 
      topK: 12, 
      perPage: 10, 
      minScore: 0.15, 
      mode: 'text',
      color: color,
      useAdvancedScoring: false,
      imageWeight: 0.6,
      textWeight: 0.2,
      metadataWeight: 0.2
    });
  };

  const handleSavedSearchSelect = (search: SavedSearch) => {
    incrementSearchUseCount(search.id);
    const orientation = search.filters?.orientation as 'landscape' | 'portrait' | 'squarish' | undefined;
    handleSearch(search.query, {
      ingest: false,
      topK: preferences.resultsPerPage,
      perPage: 10,
      minScore: search.filters?.minScore || 0.20,
      mode: 'text',
      color: search.filters?.color,
      orientation: orientation,
      useAdvancedScoring: false,
      imageWeight: 0.6,
      textWeight: 0.2,
      metadataWeight: 0.2
    });
  };

  const handleSaveCurrentSearch = () => {
    if (currentQuery || currentFilters?.color) {
      setShowSaveSearch(true);
    }
  };

  const handlePreferencesChange = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    setViewMode(newPreferences.viewMode);
  };

  // Connection status banner
  if (isConnected === false) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-700"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="text-red-500 dark:text-red-400 text-6xl mb-4"
                >
                  ⚠️
                </motion.div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Backend Unavailable</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Unable to connect to the semantic search backend. Please ensure the FastAPI server is running on localhost:8000.
                </p>
                <Button onClick={checkConnection} className="w-full">
                  Retry Connection
                </Button>
              </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
              >
                <SearchIcon className="h-6 w-6 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Semantic Image Search
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered visual discovery</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden sm:flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                  />
                  <span className="font-medium">Connected</span>
                </motion.div>
              )}
              
              <QuickSearchDropdown
                onSearchSelect={handleSavedSearchSelect}
                onSaveCurrentSearch={handleSaveCurrentSearch}
                currentQuery={currentQuery}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(true)}
                className="hidden md:flex items-center gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">Analytics</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="hidden md:flex items-center gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden lg:inline">Settings</span>
              </Button>
              
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <ThemeToggle />
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {showFilters ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-8"
          >
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              suggestedSearches={[
                'mountain landscape',
                'ocean sunset',
                'forest trees',
                'city architecture',
                'wildlife animals',
                'abstract patterns',
              ]}
            />
          </motion.div>

          {/* View Mode Toggle */}
          {results.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 pt-4 pb-2 flex justify-end"
            >
              <ViewModeToggle currentMode={viewMode} onModeChange={setViewMode} />
            </motion.div>
          )}

          {/* Results Section */}
          <div className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
                >
                  <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
                    Search Error
                  </div>
                  <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => setError(null)}
                    className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Dismiss
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EnhancedResultsGrid
                    results={results}
                    isLoading={isLoading}
                    query={currentQuery}
                    viewMode={viewMode}
                    onColorSearch={handleColorSearch}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filters Panel - Desktop */}
        <div className="hidden lg:block">
          <FiltersPanel
            onCategorySelect={handleCategorySelect}
            isVisible={true}
          />
        </div>

        {/* Filters Panel - Mobile Overlay */}
        <AnimatePresence>
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
              <motion.div
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                transition={{ type: "spring", damping: 25 }}
                className="w-80 bg-white dark:bg-gray-900"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <FiltersPanel
                  onCategorySelect={(category) => {
                    handleCategorySelect(category);
                    setShowFilters(false);
                  }}
                  isVisible={true}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        onSearchSelect={handleAnalyticsSearchSelect}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onPreferencesChange={handlePreferencesChange}
      />

      {/* Save Search Dialog */}
      <SaveSearchDialog
        isOpen={showSaveSearch}
        onClose={() => setShowSaveSearch(false)}
        query={currentQuery}
        filters={currentFilters}
      />
    </div>
  );
}
