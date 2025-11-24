'use client';

import { useState, useEffect } from 'react';
import { User, Check, Palette as PaletteIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '@/lib/api';
import { ImageLightbox } from './ImageLightbox';
import { ViewMode } from './ViewModeToggle';
import { BatchActionsToolbar } from './BatchActionsToolbar';
import { extractColorsFromImage, getColorName, isLightColor } from '@/lib/colorExtraction';
import { addToFavorites } from '@/lib/favorites';

interface EnhancedResultsGridProps {
  results: SearchResult[];
  isLoading?: boolean;
  query?: string;
  viewMode?: ViewMode;
  selectionMode?: boolean;
  onColorSearch?: (color: string) => void;
}

interface ResultCardProps {
  result: SearchResult;
  onClick: () => void;
  index: number;
  viewMode: ViewMode;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onColorClick?: (color: string) => void;
}

function ResultCard({ 
  result, 
  onClick, 
  index, 
  viewMode, 
  selectionMode,
  isSelected,
  onToggleSelect,
  onColorClick 
}: ResultCardProps) {
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  
  const imageUrl = result.metadata.image_url || result.metadata.thumbnail_url;
  const photographer = result.metadata.photographer;
  const description = result.metadata.description;
  const score = result.score;
  const existingColor = result.metadata.color;
  
  useEffect(() => {
    // Extract colors from image
    if (imageUrl && !existingColor) {
      extractColorsFromImage(imageUrl)
        .then(palette => setColorPalette(palette.palette))
        .catch(() => setColorPalette([]));
    } else if (existingColor) {
      setColorPalette([existingColor]);
    }
  }, [imageUrl, existingColor]);
  
  const getRelevanceInfo = (score: number) => {
    if (score >= 0.35) return { label: 'Excellent', color: 'bg-gradient-to-r from-green-500 to-green-600' };
    if (score >= 0.30) return { label: 'Very Good', color: 'bg-blue-500' };
    if (score >= 0.25) return { label: 'Good', color: 'bg-yellow-500' };
    if (score >= 0.20) return { label: 'Fair', color: 'bg-orange-500' };
    return { label: 'Low', color: 'bg-red-500' };
  };
  
  const relevance = getRelevanceInfo(score);
  const masonryHeight = viewMode === 'masonry' ? ['300px', '350px', '400px', '450px'][index % 4] : 'auto';

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      onToggleSelect(e);
    } else {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-2 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-200 dark:border-slate-700'
      }`}
      onClick={handleCardClick}
      style={{ height: viewMode === 'masonry' ? masonryHeight : 'auto' }}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 left-3 z-10"
          onClick={onToggleSelect}
        >
          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white/90 border-slate-300 backdrop-blur-sm'
          }`}>
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </motion.div>
      )}

      <div className={`relative overflow-hidden bg-slate-100 ${viewMode === 'grid' ? 'pb-[100%]' : 'h-full'}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={description || 'Search result'}
            className={`${viewMode === 'grid' ? 'absolute inset-0' : ''} w-full h-full object-cover group-hover:scale-105 transition-transform duration-300`}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            No image available
          </div>
        )}
        
        {/* Score Badge */}
        {!selectionMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-2 right-2 flex flex-col gap-1 items-end"
          >
            <div className="bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold">
              {(score * 100).toFixed(1)}%
            </div>
            <div className={`${relevance.color} text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow-sm`}>
              {relevance.label}
            </div>
          </motion.div>
        )}
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`h-full ${relevance.color}`}
          />
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 pointer-events-none" />
      </div>
      
      <div className="p-4 space-y-2">
        {description && (
          <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        
        {photographer && (
          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
            <User className="h-3 w-3" />
            <span className="truncate">{photographer}</span>
          </div>
        )}

        {/* Color Palette */}
        {colorPalette.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <PaletteIcon className="h-3 w-3" />
                <span>Colors</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPalette(!showPalette);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showPalette ? 'Hide' : 'Show'}
              </button>
            </div>
            
            <AnimatePresence>
              {showPalette && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex gap-1 flex-wrap"
                >
                  {colorPalette.slice(0, 5).map((color, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onColorClick?.(color);
                      }}
                      className="group/color relative w-8 h-8 rounded-md border-2 border-white dark:border-slate-600 shadow-sm hover:shadow-md transition-all"
                      style={{ backgroundColor: color }}
                      title={`Search by ${getColorName(color)}`}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover/color:bg-black/20 rounded-md transition-all" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse"
    >
      <div className={`bg-slate-200 dark:bg-slate-700 ${viewMode === 'grid' ? 'aspect-square' : 'h-64'}`} />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </motion.div>
  );
}

function CarouselView({ results, onImageClick }: { results: SearchResult[]; onImageClick: (index: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? results.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === results.length - 1 ? 0 : prev + 1));
  };

  if (results.length === 0) return null;

  const currentResult = results[currentIndex];
  const imageUrl = currentResult.metadata.image_url || currentResult.metadata.thumbnail_url;

  return (
    <div className="w-full">
      <div className="relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="aspect-[16/9] relative">
          {imageUrl && (
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              src={imageUrl}
              alt={currentResult.metadata.description || 'Search result'}
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => onImageClick(currentIndex)}
            />
          )}
          
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-3 transition-all"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-3 transition-all"
          >
            →
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {results.length}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800">
          {currentResult.metadata.description && (
            <p className="text-lg text-slate-800 dark:text-slate-200 mb-3">
              {currentResult.metadata.description}
            </p>
          )}
          {currentResult.metadata.photographer && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <User className="h-4 w-4" />
              <span>{currentResult.metadata.photographer}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {results.map((result, index) => (
          <motion.button
            key={result.id || index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentIndex(index)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
              index === currentIndex
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <img
              src={result.metadata.thumbnail_url || result.metadata.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function EnhancedResultsGrid({ 
  results, 
  isLoading = false, 
  query, 
  viewMode = 'grid',
  selectionMode = false,
  onColorSearch
}: EnhancedResultsGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(selectionMode);

  const handleToggleSelect = (resultId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(results.map(r => r.id || '')));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDownload = async () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id || ''));
    for (const result of selectedResults) {
      const imageUrl = result.metadata.image_url || result.metadata.thumbnail_url;
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `image-${result.id || Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
        } catch (error) {
          console.error('Download failed:', error);
        }
      }
    }
  };

  const handleBulkFavorite = () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id || ''));
    selectedResults.forEach(result => addToFavorites(result));
    alert(`Added ${selectedResults.length} images to favorites!`);
  };

  const handleCloseSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectedResults = results.filter(r => selectedIds.has(r.id || ''));

  if (isLoading) {
    return (
      <div className="w-full">
        <div className={`grid ${viewMode === 'masonry' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <LoadingSkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center py-12"
      >
        <div className="text-slate-500 dark:text-slate-400 text-lg mb-2">
          {query ? `No results found for "${query}"` : 'No results to display'}
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-sm">
          Try a different search term or enable &quot;Fetch New Images&quot; to get fresh content.
        </p>
      </motion.div>
    );
  }

  if (viewMode === 'carousel') {
    return (
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-sm text-slate-600 dark:text-slate-400"
        >
          Found {results.length} result{results.length !== 1 ? 's' : ''}
          {query && (
            <span className="ml-1">
              for <span className="font-medium text-slate-900 dark:text-slate-100">&quot;{query}&quot;</span>
            </span>
          )}
        </motion.div>
        
        <CarouselView results={results} onImageClick={setSelectedIndex} />
        
        {selectedIndex !== null && (
          <ImageLightbox
            results={results}
            currentIndex={selectedIndex}
            isOpen={true}
            onClose={() => setSelectedIndex(null)}
            onNavigate={setSelectedIndex}
          />
        )}
      </div>
    );
  }

  const gridClass = viewMode === 'masonry'
    ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Found {results.length} result{results.length !== 1 ? 's' : ''}
          {query && (
            <span className="ml-1">
              for <span className="font-medium text-slate-900 dark:text-slate-100">&quot;{query}&quot;</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
        </button>
      </motion.div>
      
      <div className={gridClass}>
        {results.map((result, index) => (
          <motion.div
            key={result.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={viewMode === 'masonry' ? 'break-inside-avoid' : ''}
          >
            <ResultCard
              result={result}
              onClick={() => setSelectedIndex(index)}
              index={index}
              viewMode={viewMode}
              selectionMode={isSelectionMode}
              isSelected={selectedIds.has(result.id || '')}
              onToggleSelect={handleToggleSelect(result.id || '')}
              onColorClick={onColorSearch}
            />
          </motion.div>
        ))}
      </div>
      
      {selectedIndex !== null && !isSelectionMode && (
        <ImageLightbox
          results={results}
          currentIndex={selectedIndex}
          isOpen={true}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}

      <BatchActionsToolbar
        selectedCount={selectedIds.size}
        totalCount={results.length}
        selectedResults={selectedResults}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDownload={handleBulkDownload}
        onBulkFavorite={handleBulkFavorite}
        onClose={handleCloseSelection}
      />
    </div>
  );
}
