'use client';

import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { getWeekDateRange } from '@/lib/dates';

interface WeekSelectorProps {
  selectedWeekNum: number;
  currentSystemWeekNum: number;
  semesterStartDate: string;
  onSelectWeek: (weekNum: number) => void;
}

export function WeekSelector({
  selectedWeekNum,
  currentSystemWeekNum,
  semesterStartDate,
  onSelectWeek,
}: WeekSelectorProps) {
  const isCurrentWeekSelected = selectedWeekNum === currentSystemWeekNum;
  const dateRange = getWeekDateRange(selectedWeekNum, semesterStartDate);

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 shadow-sm">
      {/* Stepper Controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={() => onSelectWeek(Math.max(1, selectedWeekNum - 1))}
          disabled={selectedWeekNum <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800"
          title="Semaine précédente"
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Week Pill Dropdown / Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedWeekNum}
            onChange={(e) => onSelectWeek(Number(e.target.value))}
            className="bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer dark:bg-zinc-950 dark:border-zinc-700/80 dark:text-zinc-100 shadow-sm"
          >
            {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Semaine S{w} {w === currentSystemWeekNum ? '(Actuelle)' : ''}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hidden xs:inline">
            • {dateRange.label}
          </span>
        </div>

        <button
          onClick={() => onSelectWeek(Math.min(14, selectedWeekNum + 1))}
          disabled={selectedWeekNum >= 14}
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800"
          title="Semaine suivante"
          aria-label="Semaine suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Date Range Mobile Display & "Aujourd'hui" button */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 xs:hidden">
          {dateRange.label}
        </span>

        {!isCurrentWeekSelected && (
          <button
            onClick={() => onSelectWeek(currentSystemWeekNum)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:border-emerald-500/30 dark:text-emerald-400 text-xs font-bold transition-all ml-auto shadow-sm"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Aujourd&apos;hui (S{currentSystemWeekNum})</span>
          </button>
        )}
      </div>
    </div>
  );
}
