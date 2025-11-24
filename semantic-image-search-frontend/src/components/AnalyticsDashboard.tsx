'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Clock, Search, BarChart3, Tag } from 'lucide-react';
import { getRecentSearches, getFavorites, RecentSearch } from '@/lib/favorites';
import { Button } from '@/components/ui/button';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSelect?: (query: string) => void;
}

export function AnalyticsDashboard({ isOpen, onClose, onSearchSelect }: AnalyticsDashboardProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setFavorites(getFavorites());
    }
  }, [isOpen]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalSearches = recentSearches.length;
    const totalFavorites = favorites.length;
    const avgResults = recentSearches.length > 0
      ? Math.round(recentSearches.reduce((sum, s) => sum + s.resultCount, 0) / recentSearches.length)
      : 0;

    // Popular search terms (word frequency)
    const wordFrequency: Record<string, number> = {};
    recentSearches.forEach(search => {
      const words = search.query.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Ignore short words
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    const popularTags = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Search timeline (last 7 days)
    const now = new Date();
    const timeline = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const count = recentSearches.filter(search => {
        const searchDate = new Date(search.searchedAt).toISOString().split('T')[0];
        return searchDate === dateStr;
      }).length;

      return {
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      };
    });

    const maxTimelineCount = Math.max(...timeline.map(t => t.count), 1);

    return {
      totalSearches,
      totalFavorites,
      avgResults,
      popularTags,
      timeline,
      maxTimelineCount,
    };
  }, [recentSearches, favorites]);

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
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your search insights and activity</p>
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{analytics.totalSearches}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Searches</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{analytics.avgResults}</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Avg Results</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <Tag className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                  <TrendingUp className="h-5 w-5 text-pink-500" />
                </div>
                <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">{analytics.totalFavorites}</div>
                <div className="text-sm text-pink-700 dark:text-pink-300">Favorites</div>
              </motion.div>
            </div>

            {/* Search Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Search Activity (Last 7 Days)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-40">
                {analytics.timeline.map((day, index) => (
                  <motion.div
                    key={day.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.count / analytics.maxTimelineCount) * 100}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full flex flex-col items-center gap-1">
                      {day.count > 0 && (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{day.count}</span>
                      )}
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg min-h-[4px]"
                        style={{ height: `${Math.max((day.count / analytics.maxTimelineCount) * 120, 4)}px` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{day.day}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Popular Search Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 mb-6">
                <Tag className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Popular Search Terms</h3>
              </div>
              {analytics.popularTags.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {analytics.popularTags.map(({ word, count }, index) => {
                    const size = Math.min(count * 4 + 12, 28);
                    const opacity = 0.5 + (count / analytics.popularTags[0].count) * 0.5;
                    return (
                      <motion.button
                        key={word}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSearchSelect?.(word)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium transition-all hover:shadow-lg"
                        style={{
                          fontSize: `${size}px`,
                          opacity,
                        }}
                      >
                        {word}
                        <span className="ml-2 text-xs opacity-75">({count})</span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No search data yet</p>
              )}
            </motion.div>

            {/* Recent Searches List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Searches</h3>
              </div>
              {recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <motion.button
                      key={search.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.05 }}
                      whileHover={{ x: 4 }}
                      onClick={() => onSearchSelect?.(search.query)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-900 dark:text-white font-medium truncate">{search.query}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{search.resultCount} results</span>
                        <span className="text-xs text-slate-400">
                          {new Date(search.searchedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent searches</p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
