'use client';

import { SessionHeroStatus } from '@/lib/dates';
import { MODULE_METADATA, DEFAULT_MODULE_COLOR } from '@/lib/constants';
import { Clock, MapPin, User, Video, Sparkles, ChevronRight } from 'lucide-react';
import { Session } from '@/types';

interface HeroSessionProps {
  hero: SessionHeroStatus | null;
  onSelectSession: (session: Session) => void;
}

export function HeroSession({ hero, onSelectSession }: HeroSessionProps) {
  if (!hero) {
    return (
      <div className="w-full p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center text-zinc-400 text-xs">
        Aucune séance programmée pour le moment.
      </div>
    );
  }

  const { session, isOngoing, timeRemainingText } = hero;
  const meta = MODULE_METADATA[session.moduleCode] || {
    title: session.moduleTitle,
    shortTitle: session.moduleCode,
    color: DEFAULT_MODULE_COLOR,
  };

  const isPresentiel = session.mode === 'P';
  const isDistance = session.mode === 'D';

  return (
    <div
      onClick={() => onSelectSession(session)}
      className="relative overflow-hidden group cursor-pointer w-full rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-5 shadow-xl transition-all duration-300 hover:border-zinc-700 active:scale-[0.99]"
    >
      {/* Decorative ambient glow */}
      <div
        className="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: meta.color.hex }}
      />

      {/* Top Status & Countdown Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isOngoing ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Séance en cours
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Prochain cours
            </span>
          )}

          <span className="text-xs font-semibold text-zinc-300 bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-zinc-700/50">
            {session.jour} • {session.horaire}
          </span>
        </div>

        {/* Live Countdown Badge */}
        <div className="flex items-center gap-1 text-xs font-bold text-zinc-200 bg-zinc-950/70 border border-zinc-800 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{timeRemainingText}</span>
        </div>
      </div>

      {/* Main Content: Room In Big Font & Module Code + Details */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wide ${meta.color.badge}`}
            >
              {session.moduleCode}
            </span>
            {session.groupNote && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {session.groupNote}
              </span>
            )}
            {isPresentiel && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Présentiel
              </span>
            )}
            {isDistance && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                <Video className="w-2.5 h-2.5" />
                À Distance
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-zinc-100 truncate tracking-tight">
            {meta.title}
          </h2>

          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{session.professeur}</span>
          </div>
        </div>

        {/* Big Room Badge (Focus on immediate orientation) */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[76px] sm:min-w-[90px] px-3 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 group-hover:border-zinc-700 shadow-inner">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            Salle
          </span>
          <span className="text-lg sm:text-2xl font-black tracking-tight text-white mt-0.5">
            {session.salle}
          </span>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-400">
        <span>Semaine {session.semaine}</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          Détails & tâches <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
