'use client';

import { useState, useRef } from 'react';
import { Search, Loader2, Settings, Upload, Image, X, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string, options: SearchOptions) => void;
  isLoading?: boolean;
  suggestedSearches?: string[];
}

export interface SearchOptions {
  ingest: boolean;
  topK: number;
  perPage: number;
  minScore: number;
  mode: 'text' | 'image' | 'hybrid';
  imageUrl?: string;
  uploadedFile?: File;
  color?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  dateFrom?: string;
  dateTo?: string;
  // Advanced scoring
  useAdvancedScoring: boolean;
  imageWeight: number;
  textWeight: number;
  metadataWeight: number;
}

export function SearchBar({ onSearch, isLoading = false, suggestedSearches = [] }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<SearchOptions>({
    ingest: false,
    topK: 8,
    perPage: 10,
    minScore: 0.20, // Default minimum score threshold
    mode: 'text', // Default to text search
    useAdvancedScoring: false,
    imageWeight: 0.6,
    textWeight: 0.2,
    metadataWeight: 0.2,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || uploadedFile) {
      onSearch(query.trim(), { ...options, uploadedFile: uploadedFile || undefined });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Optionally switch to image mode when file is uploaded
      setOptions(prev => ({ ...prev, mode: 'image' }));
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuggestedSearch = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion, options);
  };

  const defaultSuggestions = [
    'forest landscape',
    'ocean sunset',
    'mountain peaks',
    'city skyline',
    'wildlife photography',
    'abstract art',
  ];

  const displaySuggestions = suggestedSearches.length > 0 ? suggestedSearches : defaultSuggestions;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          className="relative"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-5 w-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for images by description..."
            className="w-full pl-12 pr-32 py-4 text-lg border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, ingest: !prev.ingest }))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${
                options.ingest
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span
                className={`inline-flex h-4 w-8 rounded-full transition-colors duration-200 ${
                  options.ingest ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    options.ingest ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
              Fetch new images
            </motion.button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-2 h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </motion.div>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Search Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ingest Toggle */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.ingest}
                  onChange={(e) => setOptions({ ...options, ingest: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Fetch New Images</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Get fresh images from Unsplash</p>
                </div>
              </label>
            </div>

            {/* Top K Results */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Max Results
              </label>
              <select
                value={options.topK}
                onChange={(e) => setOptions({ ...options, topK: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value={4}>4 results</option>
                <option value={8}>8 results</option>
                <option value={12}>12 results</option>
                <option value={16}>16 results</option>
                <option value={20}>20 results</option>
              </select>
            </div>

            {/* Per Page (for ingestion) */}
            {options.ingest && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Images per Fetch
                </label>
                <select
                  value={options.perPage}
                  onChange={(e) => setOptions({ ...options, perPage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={5}>5 images</option>
                  <option value={10}>10 images</option>
                  <option value={15}>15 images</option>
                  <option value={20}>20 images</option>
                  <option value={30}>30 images</option>
                </select>
              </div>
            )}

            {/* Minimum Score Threshold */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Quality Threshold
              </label>
              <div className="space-y-1">
                <input
                  type="range"
                  min="0.15"
                  max="0.40"
                  step="0.05"
                  value={options.minScore}
                  onChange={(e) => setOptions({ ...options, minScore: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>More Results</span>
                  <span className="font-medium">{(options.minScore * 100).toFixed(0)}%</span>
                  <span>Higher Quality</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Higher values show fewer but more relevant results
              </p>
            </div>

            {/* Search Mode */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Search Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['text', 'image', 'hybrid'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOptions({ ...options, mode })}
                    className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                      options.mode === mode
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mode === 'text' && 'Text'}
                    {mode === 'image' && 'Image'}
                    {mode === 'hybrid' && 'Text + Image'}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload for Image/Hybrid Search */}
            {(options.mode === 'image' || options.mode === 'hybrid') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Reference Image
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Enter image URL..."
                    value={options.imageUrl || ''}
                    onChange={(e) => setOptions({ ...options, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    disabled={!!uploadedFile}
                  />
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                    or
                  </div>
                  {uploadedFile ? (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">
                        {uploadedFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            {/* Advanced Filters */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Advanced Filters</h4>
              
              {/* Color Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Color
                </label>
                <select
                  value={options.color || ''}
                  onChange={(e) => setOptions({ ...options, color: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Any Color</option>
                  <option value="black_and_white">Black & White</option>
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                  <option value="magenta">Magenta</option>
                  <option value="green">Green</option>
                  <option value="teal">Teal</option>
                  <option value="blue">Blue</option>
                </select>
              </div>

              {/* Orientation Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Orientation
                </label>
                <select
                  value={options.orientation || ''}
                  onChange={(e) => setOptions({ ...options, orientation: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Any Orientation</option>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="squarish">Square</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={options.dateFrom || ''}
                    onChange={(e) => setOptions({ ...options, dateFrom: e.target.value || undefined })}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="date"
                    value={options.dateTo || ''}
                    onChange={(e) => setOptions({ ...options, dateTo: e.target.value || undefined })}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Scoring Toggle */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Advanced Scoring
                </label>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, useAdvancedScoring: !options.useAdvancedScoring })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    options.useAdvancedScoring
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      options.useAdvancedScoring ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Combine image, text, and metadata scores with custom weights
              </p>
            </div>

            {/* Weight Controls (only show when advanced scoring is enabled) */}
            {options.useAdvancedScoring && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Score Weights</h4>
                
                {/* Image Weight */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-slate-700 dark:text-slate-300">Image Similarity</label>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {(options.imageWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={options.imageWeight}
                    onChange={(e) => setOptions({ ...options, imageWeight: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                </div>

                {/* Text Weight */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-slate-700 dark:text-slate-300">Text/Metadata</label>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {(options.textWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={options.textWeight}
                    onChange={(e) => setOptions({ ...options, textWeight: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                </div>

                {/* Metadata Weight */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-slate-700 dark:text-slate-300">Color/Filters</label>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {(options.metadataWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={options.metadataWeight}
                    onChange={(e) => setOptions({ ...options, metadataWeight: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                  <strong>Tip:</strong> Higher image weight for visual similarity, higher text weight for semantic matching, higher metadata weight for specific attributes like color.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Suggested Searches */}
      {!isLoading && displaySuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">Try these searches:</p>
          <div className="flex flex-wrap gap-2">
            {displaySuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => handleSuggestedSearch(suggestion)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200 text-slate-700 dark:text-slate-300"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
