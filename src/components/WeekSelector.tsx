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
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
      {/* Stepper Controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={() => onSelectWeek(Math.max(1, selectedWeekNum - 1))}
          disabled={selectedWeekNum <= 1}
          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            className="bg-zinc-950 border border-zinc-700/80 text-zinc-100 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Semaine S{w} {w === currentSystemWeekNum ? '(Actuelle)' : ''}
              </option>
            ))}
          </select>

          <span className="text-xs font-medium text-zinc-400 hidden xs:inline">
            • {dateRange.label}
          </span>
        </div>

        <button
          onClick={() => onSelectWeek(Math.min(14, selectedWeekNum + 1))}
          disabled={selectedWeekNum >= 14}
          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Semaine suivante"
          aria-label="Semaine suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Date Range Mobile Display & "Aujourd'hui" button */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-xs font-medium text-zinc-400 xs:hidden">
          {dateRange.label}
        </span>

        {!isCurrentWeekSelected && (
          <button
            onClick={() => onSelectWeek(currentSystemWeekNum)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all ml-auto"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Aujourd&apos;hui (S{currentSystemWeekNum})</span>
          </button>
        )}
      </div>
    </div>
  );
}
