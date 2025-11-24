'use client';

import { Grid3x3, LayoutGrid, Rows3 } from 'lucide-react';
import { motion } from 'framer-motion';

export type ViewMode = 'grid' | 'masonry' | 'carousel';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ currentMode, onModeChange }: ViewModeToggleProps) {
  const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'grid', icon: <Grid3x3 className="h-4 w-4" />, label: 'Grid' },
    { mode: 'masonry', icon: <LayoutGrid className="h-4 w-4" />, label: 'Masonry' },
    { mode: 'carousel', icon: <Rows3 className="h-4 w-4" />, label: 'Carousel' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
      {modes.map(({ mode, icon, label }) => (
        <motion.button
          key={mode}
          onClick={() => onModeChange(mode)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
            flex items-center gap-2
            ${
              currentMode === mode
                ? 'text-white dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }
          `}
        >
          {currentMode === mode && (
            <motion.div
              layoutId="activeMode"
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
