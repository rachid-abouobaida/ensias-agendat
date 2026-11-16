'use client';

import { useState } from 'react';
import { Session, Task } from '@/types';
import { DAYS_ORDER } from '@/lib/constants';
import { getDateForWeekAndDay, SessionHeroStatus } from '@/lib/dates';
import { HeroSession } from './HeroSession';
import { WeekSelector } from './WeekSelector';
import { SessionCard } from './SessionCard';
import { Calendar, Layers } from 'lucide-react';

interface WeekViewProps {
  sessions: Session[];
  tasks: Task[];
  selectedWeekNum: number;
  currentSystemWeekNum: number;
  semesterStartDate: string;
  heroSession: SessionHeroStatus | null;
  onSelectWeek: (weekNum: number) => void;
  onSelectSession: (session: Session) => void;
}

export function WeekView({
  sessions,
  tasks,
  selectedWeekNum,
  currentSystemWeekNum,
  semesterStartDate,
  heroSession,
  onSelectWeek,
  onSelectSession,
}: WeekViewProps) {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('TOUS');

  // Filter sessions for the selected week
  const weekSessions = sessions.filter(
    (s) => s.weekNum === selectedWeekNum && !s.isCancelled
  );

  // Group sessions by day
  const sessionsByDay: Record<string, Session[]> = {};
  DAYS_ORDER.forEach((day) => {
    sessionsByDay[day] = weekSessions
      .filter((s) => s.jour === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Calculate day dates for headers
  const getDayLabel = (day: string) => {
    const date = getDateForWeekAndDay(selectedWeekNum, day, semesterStartDate);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const activeDays = DAYS_ORDER.filter(
    (day) =>
      selectedDayFilter === 'TOUS' || selectedDayFilter === day
  );

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* 1. Real-time Hero Card */}
      <HeroSession hero={heroSession} onSelectSession={onSelectSession} />

      {/* 2. Compact Week Stepper (< S1 ... S14 >) + Aujourd'hui */}
      <WeekSelector
        selectedWeekNum={selectedWeekNum}
        currentSystemWeekNum={currentSystemWeekNum}
        semesterStartDate={semesterStartDate}
        onSelectWeek={onSelectWeek}
      />

      {/* 3. Day Tabs for quick thumb-filtering */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedDayFilter('TOUS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            selectedDayFilter === 'TOUS'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-sm'
          }`}
        >
          Tous les jours ({weekSessions.length})
        </button>

        {DAYS_ORDER.map((day) => {
          const count = sessionsByDay[day]?.length || 0;
          if (count === 0 && selectedDayFilter !== day) return null;
          const isSelected = selectedDayFilter === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-sm'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-slate-800 text-slate-200 dark:bg-zinc-950 dark:text-zinc-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Weekly Days & Sessions Grid */}
      {weekSessions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500 shadow-sm">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-400">
            Aucun cours programmé en Semaine S{selectedWeekNum}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
            Sélectionnez une autre semaine ou ajoutez une séance de rattrapage dans l&apos;onglet Édition.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDays.map((day) => {
            const dayList = sessionsByDay[day] || [];
            if (dayList.length === 0) return null;

            // Group by horaire to cleanly identify overlaps (e.g. S7 Lundi 17:00-18:50)
            const groupedByTime: Record<string, Session[]> = {};
            dayList.forEach((s) => {
              if (!groupedByTime[s.horaire]) {
                groupedByTime[s.horaire] = [];
              }
              groupedByTime[s.horaire].push(s);
            });

            return (
              <div
                key={day}
                className="rounded-2xl border border-slate-200/90 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/60 p-3.5 sm:p-4 shadow-sm"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                      {day}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {getDayLabel(day)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    {dayList.length} séance{dayList.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Slots List */}
                <div className="space-y-2.5">
                  {Object.entries(groupedByTime).map(([horaire, slotSessions]) => {
                    const hasOverlap = slotSessions.length > 1;

                    return (
                      <div key={horaire} className="space-y-1.5">
                        {hasOverlap && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 text-[10px] font-bold w-fit shadow-xs">
                            <Layers className="w-3 h-3 text-amber-600" />
                            <span>Séances simultanées ({slotSessions.length} groupes SDSI)</span>
                          </div>
                        )}

                        <div
                          className={`grid gap-2.5 ${
                            hasOverlap ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                          }`}
                        >
                          {slotSessions.map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              tasks={tasks}
                              onSelect={onSelectSession}
                              isOverlapping={hasOverlap}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
