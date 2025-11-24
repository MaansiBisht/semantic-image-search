'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveSearch } from '@/lib/preferences';

interface SaveSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  filters?: any;
}

const EMOJI_OPTIONS = ['🏔️', '🌊', '🌲', '🏙️', '🌅', '🎨', '📸', '⭐', '🔥', '💎', '🌈', '🚀'];

export function SaveSearchDialog({ isOpen, onClose, query, filters }: SaveSearchDialogProps) {
  const [name, setName] = useState(query || 'My Search');
  const [selectedIcon, setSelectedIcon] = useState('⭐');

  const handleSave = () => {
    if (!name.trim()) return;

    saveSearch({
      name: name.trim(),
      query,
      filters,
      icon: selectedIcon,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Save Search</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Quick access to your favorite searches</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Search Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mountain Landscapes"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Choose an Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedIcon(emoji)}
                    className={`aspect-square text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                      selectedIcon === emoji
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Preview:</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedIcon}</span>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{name || 'My Search'}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{query || 'Search query'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
