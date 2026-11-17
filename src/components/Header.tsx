'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Calendar as CalendarIcon, Sliders, Database } from 'lucide-react';
import { getWeekDateRange } from '@/lib/dates';

interface HeaderProps {
  currentWeekNum: number;
  semesterStartDate: string;
  onOpenSettings?: () => void;
}

export function Header({
  currentWeekNum,
  semesterStartDate,
  onOpenSettings,
}: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    // Check initial theme from localStorage or document
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    // Format current date
    const now = new Date();
    const formatted = now.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    setCurrentDateStr(formatted);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const weekRange = getWeekDateRange(currentWeekNum, semesterStartDate);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md px-4 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Academic Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-xs tracking-wider">
            S1
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
                SDSI <span className="text-emerald-600 dark:text-emerald-500">ENSIAS</span>
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                2026-2027
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              Semaine S{currentWeekNum} • {weekRange.label}
            </p>
          </div>
        </div>

        {/* Quick Actions (SQLite, Date, Theme toggle, Settings) */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
            title="Base de données SQLite locale active (Offline PWA)"
          >
            <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">SQLite Local</span>
          </div>

          {currentDateStr && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-zinc-900/80 dark:border-zinc-800 dark:text-zinc-300">
              <CalendarIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
              <span className="capitalize">{currentDateStr}</span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
            title={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
              title="Paramètres de l'emploi du temps"
              aria-label="Paramètres"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
