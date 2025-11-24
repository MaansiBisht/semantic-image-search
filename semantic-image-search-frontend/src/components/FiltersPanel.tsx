'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Database, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient, Category, StatsResponse } from '../lib/api';
import { Button } from './ui/button';

interface FiltersPanelProps {
  onCategorySelect: (category: string) => void;
  isVisible: boolean;
}

export function FiltersPanel({ onCategorySelect, isVisible }: FiltersPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadCategories();
      loadStats();
    }
  }, [isVisible]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await apiClient.getCategories(12);
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiClient.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 space-y-6"
      >
        {/* Stats Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Database Stats</h3>
          </div>
          
          {isLoadingStats ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Total Vectors</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_vectors.toLocaleString()}
                  </span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-300">Dimension</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {stats.dimension}
                  </span>
                </div>
              </motion.div>
              
              {Object.entries(stats.namespaces).map(([namespace, count], index) => (
                <motion.div
                  key={namespace}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Namespace: {namespace}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Failed to load stats
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Popular Categories</h3>
          
          {isLoadingCategories ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category, index) => (
                <motion.button
                  key={category.id || category.slug}
                  onClick={() => onCategorySelect(category.title || '')}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                >
                  <div className="flex items-center space-x-3">
                    {category.cover_photo_url && (
                      <img
                        src={category.cover_photo_url}
                        alt={category.title || ''}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {category.title}
                      </h4>
                      {category.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No categories available
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => loadStats()}
              disabled={isLoadingStats}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => loadCategories()}
              disabled={isLoadingCategories}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Categories
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
