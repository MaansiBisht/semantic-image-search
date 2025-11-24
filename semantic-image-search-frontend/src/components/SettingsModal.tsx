'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserPreferences, getPreferences, savePreferences, resetPreferences } from '@/lib/preferences';
import { ViewMode } from '@/components/ViewModeToggle';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

export function SettingsModal({ isOpen, onClose, onPreferencesChange }: SettingsModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreferences(getPreferences());
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    savePreferences(preferences);
    onPreferencesChange?.(preferences);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    resetPreferences();
    const defaults = getPreferences();
    setPreferences(defaults);
    onPreferencesChange?.(defaults);
    setHasChanges(true);
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
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Preferences</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Customize your search experience</p>
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

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
            {/* View Mode */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Default View Mode
              </label>
              <div className="flex gap-3">
                {(['grid', 'masonry', 'carousel'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleChange('viewMode', mode)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                      preferences.viewMode === mode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Per Page */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Results Per Page
              </label>
              <div className="flex gap-3">
                {[8, 12, 16, 24].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleChange('resultsPerPage', count)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                      preferences.resultsPerPage === count
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Theme Preference
              </label>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleChange('theme', theme)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                      preferences.theme === theme
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Additional Options
              </h3>

              <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Auto-save Searches</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Automatically save your search history</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoSaveSearches}
                  onChange={(e) => handleChange('autoSaveSearches', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Show Color Palettes</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Display extracted colors on image cards</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.showColorPalettes}
                  onChange={(e) => handleChange('showColorPalettes', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Keyboard Shortcuts</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Enable Cmd+1-9 for quick searches</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableKeyboardShortcuts}
                  onChange={(e) => handleChange('enableKeyboardShortcuts', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
