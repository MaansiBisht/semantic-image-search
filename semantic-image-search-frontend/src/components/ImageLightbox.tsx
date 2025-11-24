'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink, Heart, User, Tag, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { addToFavorites, removeFromFavorites, isFavorited } from '@/lib/favorites';

interface ImageLightboxProps {
  results: SearchResult[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ results, currentIndex, isOpen, onClose, onNavigate }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const result = results[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  useEffect(() => {
    // Reset zoom and position when image changes
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, onClose, handlePrevious, handleNext]);

  if (!isOpen || !result) return null;

  const imageUrl = result.metadata.image_url || result.metadata.thumbnail_url;
  const photographer = result.metadata.photographer;
  const photographerProfile = result.metadata.photographer_profile;
  const description = result.metadata.description;
  const tags = result.metadata.tags || [];
  const color = result.metadata.color;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
    if (zoom <= 1.5) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50"
        onClick={onClose}
      >
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm transition-all z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </motion.button>
        )}

        {currentIndex < results.length - 1 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm transition-all z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </motion.button>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-7xl mx-4 max-h-[95vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
            <div className="flex items-center gap-2 text-white text-sm">
              <span className="font-medium">{currentIndex + 1}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-400">{results.length}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  className="p-2 hover:bg-slate-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-white text-sm px-2 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-2 hover:bg-slate-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className="flex-1 overflow-hidden bg-black flex items-center justify-center relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {imageUrl && (
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={imageUrl}
                alt={description || 'Search result'}
                className="max-w-full max-h-full object-contain select-none"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Bottom Info Panel */}
          <div className="p-6 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 space-y-4">
            {description && (
              <p className="text-white text-lg">{description}</p>
            )}
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {photographer && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {photographerProfile ? (
                      <a
                        href={photographerProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {photographer}
                      </a>
                    ) : (
                      <span className="text-slate-300">{photographer}</span>
                    )}
                  </div>
                )}
                
                {color && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-slate-400" />
                    <div
                      className="w-6 h-6 rounded border border-slate-600"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-slate-400">{color}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full">
                  <span className="text-xs text-slate-400">Score:</span>
                  <span className="text-sm font-medium text-white">{(result.score * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {imageUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(imageUrl, '_blank')}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleFavorite}
                      className={favorited ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}
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
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
