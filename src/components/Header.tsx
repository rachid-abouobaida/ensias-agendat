'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Sun, Moon, Calendar as CalendarIcon, Sliders } from 'lucide-react';
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    // Check initial theme from document
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');

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
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md px-4 py-2.5 transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/85 light:bg-white/85 light:border-zinc-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Academic Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-xs tracking-wider">
            S1
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-zinc-100 light:text-zinc-900 leading-tight">
                SDSI <span className="text-emerald-500">ENSIAS</span>
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 light:bg-zinc-100 light:text-zinc-700">
                2026-2027
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 light:text-zinc-500 font-medium">
              Semaine S{currentWeekNum} • {weekRange.label}
            </p>
          </div>
        </div>

        {/* Quick Actions (Date, Theme toggle, Settings) */}
        <div className="flex items-center gap-1.5">
          {currentDateStr && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-[11px] font-medium text-zinc-300 light:bg-zinc-100 light:border-zinc-200 light:text-zinc-700">
              <CalendarIcon className="w-3 h-3 text-emerald-500" />
              <span className="capitalize">{currentDateStr}</span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors light:bg-zinc-100 light:border-zinc-200 light:text-zinc-700"
            title="Changer de thème"
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors light:bg-zinc-100 light:border-zinc-200 light:text-zinc-700"
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
