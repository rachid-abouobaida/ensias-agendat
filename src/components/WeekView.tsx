'use client';

import { useState, useEffect } from 'react';
import { Session, Task } from '@/types';
import { DAYS_ORDER } from '@/lib/constants';
import { getDateForWeekAndDay, getCurrentDayName, SessionHeroStatus } from '@/lib/dates';
import { HeroSession } from './HeroSession';
import { WeekSelector } from './WeekSelector';
import { SessionCard } from './SessionCard';
import {
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ListFilter,
  SlidersHorizontal,
} from 'lucide-react';

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
  // Determine current day index (0 for Lundi ... 5 for Samedi)
  const systemDayName = getCurrentDayName(new Date());
  const initialDayIndex = Math.max(
    0,
    DAYS_ORDER.indexOf(systemDayName as typeof DAYS_ORDER[number])
  );

  // Active day index for slider (0 to 5)
  const [activeDayIndex, setActiveDayIndex] = useState<number>(
    initialDayIndex !== -1 ? initialDayIndex : 0
  );

  // Slide transition direction for smooth animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Mode: 'slider' (default requested) vs 'all' (full week list)
  const [viewMode, setViewMode] = useState<'slider' | 'all'>('slider');

  // Sync with current day when switching to the current week
  useEffect(() => {
    if (selectedWeekNum === currentSystemWeekNum) {
      const idx = DAYS_ORDER.indexOf(systemDayName as typeof DAYS_ORDER[number]);
      if (idx !== -1) setActiveDayIndex(idx);
    }
  }, [selectedWeekNum, currentSystemWeekNum, systemDayName]);

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
  const getDayFormatted = (day: string) => {
    const date = getDateForWeekAndDay(selectedWeekNum, day, semesterStartDate);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getDayShortLabel = (day: string) => {
    const date = getDateForWeekAndDay(selectedWeekNum, day, semesterStartDate);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const currentActiveDay = DAYS_ORDER[activeDayIndex];
  const isCurrentDayToday =
    selectedWeekNum === currentSystemWeekNum &&
    currentActiveDay === systemDayName;

  const currentDaySessions = sessionsByDay[currentActiveDay] || [];

  // Navigation handlers for Slider
  const handlePrevDay = () => {
    if (activeDayIndex > 0) {
      setSlideDirection('left');
      setActiveDayIndex(activeDayIndex - 1);
    } else {
      // Loop or go to previous week if desired, or stay at 0
      setSlideDirection('left');
      setActiveDayIndex(DAYS_ORDER.length - 1);
    }
  };

  const handleNextDay = () => {
    if (activeDayIndex < DAYS_ORDER.length - 1) {
      setSlideDirection('right');
      setActiveDayIndex(activeDayIndex + 1);
    } else {
      setSlideDirection('right');
      setActiveDayIndex(0);
    }
  };

  const handleSelectDay = (index: number) => {
    setSlideDirection(index > activeDayIndex ? 'right' : 'left');
    setActiveDayIndex(index);
  };

  // Group current day's sessions by horaire to identify overlaps
  const groupedByTime: Record<string, Session[]> = {};
  currentDaySessions.forEach((s) => {
    if (!groupedByTime[s.horaire]) {
      groupedByTime[s.horaire] = [];
    }
    groupedByTime[s.horaire].push(s);
  });

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

      {/* 3. Slider Controls & View Mode Toggle */}
      <div className="flex items-center justify-between gap-2">
        {/* Day Selector Pills for fast jumping */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {DAYS_ORDER.map((day, idx) => {
            const count = sessionsByDay[day]?.length || 0;
            const isSelected = activeDayIndex === idx && viewMode === 'slider';
            const isToday =
              selectedWeekNum === currentSystemWeekNum && day === systemDayName;

            return (
              <button
                key={day}
                onClick={() => {
                  setViewMode('slider');
                  handleSelectDay(idx);
                }}
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950 scale-105'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-xs'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-bold ${
                    isSelected
                      ? 'bg-slate-800 text-slate-200 dark:bg-zinc-950 dark:text-zinc-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>

                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -top-0.5 right-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* View mode toggle button */}
        <button
          onClick={() => setViewMode(viewMode === 'slider' ? 'all' : 'slider')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 text-xs font-semibold shrink-0 shadow-xs transition-colors"
          title={
            viewMode === 'slider'
              ? 'Afficher toute la semaine en liste'
              : 'Afficher sous forme de slider jour par jour'
          }
        >
          {viewMode === 'slider' ? (
            <>
              <ListFilter className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xs:inline">Vue Semaine</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">Vue Slider</span>
            </>
          )}
        </button>
      </div>

      {/* 4. SLIDER VIEW (Default Mode) */}
      {viewMode === 'slider' ? (
        <div className="space-y-3">
          {/* Slider Day Header Card with Précédent / Suivant */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-950/80 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
            {/* Bouton Précédent */}
            <button
              onClick={handlePrevDay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 shadow-xs active:scale-95"
              title="Jour précédent"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Current Day Label in Slider */}
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 capitalize tracking-tight">
                  {getDayFormatted(currentActiveDay)}
                </h3>
                {isCurrentDayToday && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 text-[10px] font-bold uppercase tracking-wide">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                {currentDaySessions.length} cours prévu
                {currentDaySessions.length > 1 ? 's' : ''} • Jour {activeDayIndex + 1}/6
              </p>
            </div>

            {/* Bouton Suivant */}
            <button
              onClick={handleNextDay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 shadow-xs active:scale-95"
              title="Jour suivant"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Slider Content: Sessions for Current Day */}
          <div
            key={`${selectedWeekNum}-${currentActiveDay}`}
            className={`space-y-3 transition-all duration-300 ${
              slideDirection === 'right'
                ? 'animate-in fade-in slide-in-from-right-4'
                : 'animate-in fade-in slide-in-from-left-4'
            }`}
          >
            {currentDaySessions.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500 shadow-sm">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Aucun cours prévu ce {currentActiveDay}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                  Profitez de cette journée libre pour réviser, travailler sur vos projets ou souffler.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={handleNextDay}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <span>Voir le jour suivant</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
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
            )}
          </div>
        </div>
      ) : (
        /* 5. FULL WEEK VIEW (Collapsible Alternative) */
        <div className="space-y-4 animate-in fade-in">
          {DAYS_ORDER.map((day) => {
            const dayList = sessionsByDay[day] || [];
            if (dayList.length === 0) return null;

            const dayGrouped: Record<string, Session[]> = {};
            dayList.forEach((s) => {
              if (!dayGrouped[s.horaire]) dayGrouped[s.horaire] = [];
              dayGrouped[s.horaire].push(s);
            });

            return (
              <div
                key={day}
                className="rounded-2xl border border-slate-200/90 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/60 p-3.5 sm:p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                      {day}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {getDayShortLabel(day)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    {dayList.length} séance{dayList.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(dayGrouped).map(([horaire, slotSessions]) => {
                    const hasOverlap = slotSessions.length > 1;
                    return (
                      <div key={horaire} className="space-y-1.5">
                        {hasOverlap && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold w-fit shadow-xs">
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
