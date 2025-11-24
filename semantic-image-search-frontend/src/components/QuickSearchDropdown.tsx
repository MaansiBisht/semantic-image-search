'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Edit2, Trash2, Command } from 'lucide-react';
import { SavedSearch, getSavedSearches, deleteSavedSearch, assignShortcutKey } from '@/lib/preferences';
import { Button } from '@/components/ui/button';

interface QuickSearchDropdownProps {
  onSearchSelect: (search: SavedSearch) => void;
  onSaveCurrentSearch?: () => void;
  currentQuery?: string;
}

export function QuickSearchDropdown({ 
  onSearchSelect, 
  onSaveCurrentSearch,
  currentQuery 
}: QuickSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearches(getSavedSearches());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedSearch(id);
    setSearches(getSavedSearches());
  };

  const handleAssignShortcut = (id: string, key: number, e: React.MouseEvent) => {
    e.stopPropagation();
    assignShortcutKey(id, key);
    setSearches(getSavedSearches());
  };

  const getShortcutDisplay = (key?: number) => {
    if (!key) return null;
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
        <Command className="h-3 w-3" />
        {key}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="hidden sm:inline">Quick Search</span>
        {searches.length > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {searches.length}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-700">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Quick Searches</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Access your saved searches instantly
              </p>
            </div>

            {/* Searches List */}
            <div className="max-h-96 overflow-y-auto">
              {searches.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-400 dark:text-slate-500 mb-2">
                    <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No saved searches yet</p>
                    <p className="text-xs mt-1">Save your frequent searches for quick access</p>
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  {searches.map((search, index) => (
                    <motion.div
                      key={search.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      <button
                        onClick={() => {
                          onSearchSelect(search);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {search.icon && <span className="text-lg">{search.icon}</span>}
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {search.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                            {search.query || 'Color search'}
                            {search.useCount > 0 && ` • Used ${search.useCount}x`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          {getShortcutDisplay(search.shortcutKey)}
                          
                          {/* Edit/Delete buttons (show on hover) */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            {!search.shortcutKey && editingId === search.id && (
                              <div className="flex gap-1 bg-slate-100 dark:bg-slate-600 rounded p-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(key => (
                                  <button
                                    key={key}
                                    onClick={(e) => {
                                      handleAssignShortcut(search.id, key, e);
                                      setEditingId(null);
                                    }}
                                    className="w-6 h-6 text-xs hover:bg-blue-500 hover:text-white rounded transition-colors"
                                  >
                                    {key}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {!editingId && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(search.id);
                                  }}
                                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                                  title="Assign shortcut"
                                >
                                  <Edit2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(search.id, e)}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {currentQuery && onSaveCurrentSearch && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={() => {
                    onSaveCurrentSearch();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Save Current Search
                </button>
              </div>
            )}

            {/* Keyboard Shortcuts Help */}
            {searches.some(s => s.shortcutKey) && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Command className="h-3 w-3" />
                  Press Cmd+1-9 for quick access
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
