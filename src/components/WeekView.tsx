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
      {/* 1. Real-time Hero Card (Only shown if current system week is selected or as upcoming course) */}
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
              ? 'bg-zinc-100 text-zinc-950 shadow-sm'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Tous les jours ({weekSessions.length})
        </button>

        {DAYS_ORDER.map((day) => {
          const count = sessionsByDay[day]?.length || 0;
          if (count === 0 && selectedDayFilter !== day) return null; // hide days with no classes unless active
          const isSelected = selectedDayFilter === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1 rounded-full ${
                  isSelected
                    ? 'bg-zinc-950 text-zinc-200'
                    : 'bg-zinc-800 text-zinc-400'
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
        <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-zinc-400">
            Aucun cours programmé en Semaine S{selectedWeekNum}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
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
                className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 sm:p-4"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-black text-zinc-100 tracking-tight">
                      {day}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400">
                      {getDayLabel(day)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-400">
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
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold w-fit">
                            <Layers className="w-3 h-3" />
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
