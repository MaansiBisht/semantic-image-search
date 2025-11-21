'use client';

import { useState } from 'react';
import { ExternalLink, Download, User, Tag, Palette, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { addToFavorites, removeFromFavorites, isFavorited } from '@/lib/favorites';

interface ResultsGridProps {
  results: SearchResult[];
  isLoading?: boolean;
  query?: string;
}

interface ImageModalProps {
  result: SearchResult;
  isOpen: boolean;
  onClose: () => void;
}

function ImageModal({ result, isOpen, onClose }: ImageModalProps) {
  if (!isOpen) return null;

  const imageUrl = result.metadata.image_url || result.metadata.thumbnail_url;
  const photographer = result.metadata.photographer;
  const photographerProfile = result.metadata.photographer_profile;
  const description = result.metadata.description;
  const tags = result.metadata.tags || [];
  const color = result.metadata.color;

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `semantic-search-${result.id || 'image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleToggleFavorite = () => {
    if (isFavorited(result.id || '')) {
      removeFromFavorites(result.id || '');
    } else {
      addToFavorites(result);
    }
  };

  const favorited = isFavorited(result.id || '');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
        >
        <div className="relative">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={description || 'Search result'}
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          )}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 bg-black/50 dark:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/75 dark:hover:bg-white/30 backdrop-blur-sm transition-colors"
          >
            ×
          </motion.button>
        </div>
        
        <div className="p-6 space-y-4">
          {description && (
            <p className="text-slate-800 dark:text-slate-200 text-lg">{description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {photographer && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-500" />
                  {photographerProfile ? (
                    <a
                      href={photographerProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {photographer}
                    </a>
                  ) : (
                    <span className="text-slate-700 dark:text-slate-300">{photographer}</span>
                  )}
                </div>
              )}
              
              {color && (
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-slate-500" />
                  <div
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{color}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {imageUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleFavorite}
                    className={favorited ? 'text-red-500 border-red-300 hover:bg-red-50' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${favorited ? 'fill-current' : ''}`} />
                    {favorited ? 'Favorited' : 'Favorite'}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-slate-500 dark:text-slate-400 border-t dark:border-slate-700 pt-4">
            Similarity Score: {(result.score * 100).toFixed(1)}%
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ResultCard({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const imageUrl = result.metadata.image_url || result.metadata.thumbnail_url;
  const photographer = result.metadata.photographer;
  const description = result.metadata.description;
  const score = result.score;
  
  // Calculate relevance level and color
  // CLIP embeddings typically produce scores in 0.2-0.4 range for good matches
  const getRelevanceInfo = (score: number) => {
    if (score >= 0.35) return { label: 'Excellent Match', color: 'bg-linear-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500', textColor: 'text-green-700 dark:text-green-300' };
    if (score >= 0.30) return { label: 'Very Good Match', color: 'bg-blue-500 dark:bg-blue-400', textColor: 'text-blue-700 dark:text-blue-300' };
    if (score >= 0.25) return { label: 'Good Match', color: 'bg-yellow-500 dark:bg-yellow-400', textColor: 'text-yellow-700 dark:text-yellow-300' };
    if (score >= 0.20) return { label: 'Fair Match', color: 'bg-orange-500 dark:bg-orange-400', textColor: 'text-orange-700 dark:text-orange-300' };
    return { label: 'Low Match', color: 'bg-red-500 dark:bg-red-400', textColor: 'text-red-700 dark:text-red-300' };
  };
  
  const relevance = getRelevanceInfo(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-700"
      onClick={onClick}
    >
      <div className="relative overflow-hidden bg-slate-100" style={{ paddingBottom: '100%' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={description || 'Search result'}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            No image available
          </div>
        )}
        
        {/* Overlay with score and relevance */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-2 right-2 flex flex-col gap-1 items-end"
        >
          <div className="bg-black/80 dark:bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold">
            {(score * 100).toFixed(1)}%
          </div>
          <div className={`${relevance.color} text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow-sm`}>
            {relevance.label}
          </div>
        </motion.div>
        
        {/* Relevance indicator bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`h-full ${relevance.color}`}
          />
        </div>
        
        {/* Hover overlay */}
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
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse"
    >
      <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </motion.div>
  );
}

export function ResultsGrid({ results, isLoading = false, query }: ResultsGridProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <LoadingSkeleton key={index} />
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
          Try a different search term or enable "Fetch New Images" to get fresh content.
        </p>
      </motion.div>
    );
  }

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
              for <span className="font-medium text-slate-900 dark:text-slate-100">"{query}"</span>
            </span>
          )}
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((result, index) => (
          <motion.div
            key={result.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ResultCard
              result={result}
              onClick={() => setSelectedResult(result)}
            />
          </motion.div>
        ))}
      </div>
      
      {selectedResult && (
        <ImageModal
          result={selectedResult}
          isOpen={true}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
