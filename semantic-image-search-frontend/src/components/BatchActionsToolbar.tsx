'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, Heart, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchResult } from '@/lib/api';

interface BatchActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  selectedResults: SearchResult[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDownload: () => void;
  onBulkFavorite: () => void;
  onClose: () => void;
}

export function BatchActionsToolbar({
  selectedCount,
  totalCount,
  selectedResults,
  onSelectAll,
  onDeselectAll,
  onBulkDownload,
  onBulkFavorite,
  onClose,
}: BatchActionsToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl border border-blue-400/20 backdrop-blur-xl">
            <div className="px-6 py-4 flex items-center gap-4">
              {/* Selection Info */}
              <div className="flex items-center gap-3 text-white">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/20 rounded-full p-2"
                >
                  <CheckSquare className="h-5 w-5" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{selectedCount} Selected</span>
                  <span className="text-xs text-blue-100">of {totalCount} images</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-white/20" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={allSelected ? onDeselectAll : onSelectAll}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {allSelected ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>

                <Button
                  onClick={onBulkDownload}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download ({selectedCount})
                </Button>

                <Button
                  onClick={onBulkFavorite}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite ({selectedCount})
                </Button>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-white/20" />

              {/* Close */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(selectedCount / totalCount) * 100}%` }}
              className="h-1 bg-white/40 rounded-b-2xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
