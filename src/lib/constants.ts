export const DEFAULT_SEMESTER_START =
  process.env.NEXT_PUBLIC_SEMESTER_START_DATE || '2026-10-05';

export const DAYS_ORDER = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

export const DAY_OFFSETS: Record<string, number> = {
  Lundi: 0,
  Mardi: 1,
  Mardi_: 1,
  Mercredi: 2,
  Jeudi: 3,
  Vendredi: 4,
  Samedi: 5,
};

export const MODULE_METADATA: Record<
  string,
  {
    title: string;
    shortTitle: string;
    color: {
      bg: string;
      text: string;
      border: string;
      badge: string;
      glow: string;
      accent: string;
      hex: string;
    };
  }
> = {
  M111: {
    title: 'Statistique inférentielle & analyse et visualisation',
    shortTitle: 'Stats & Visualisation',
    color: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30 dark:border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      accent: 'emerald',
      hex: '#10b981',
    },
  },
  M112: {
    title: 'Bases de traitement des données multimédias',
    shortTitle: 'Données Multimédias',
    color: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      text: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-500/30 dark:border-cyan-500/30',
      badge: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      glow: 'shadow-cyan-500/10',
      accent: 'cyan',
      hex: '#06b6d4',
    },
  },
  M113: {
    title: 'Algorithmique avancée et structures de données',
    shortTitle: 'Algo Avancée & SD',
    color: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-500/30 dark:border-indigo-500/30',
      badge: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      glow: 'shadow-indigo-500/10',
      accent: 'indigo',
      hex: '#6366f1',
    },
  },
  M114: {
    title: "Techniques de l'Intelligence Artificielle",
    shortTitle: 'Techniques IA',
    color: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30 dark:border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
      glow: 'shadow-amber-500/10',
      accent: 'amber',
      hex: '#f59e0b',
    },
  },
  M115: {
    title: 'Ingénierie des Données et Systèmes Décisionnels',
    shortTitle: 'Ingénierie Données & BI',
    color: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30 dark:border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
      glow: 'shadow-rose-500/10',
      accent: 'rose',
      hex: '#f43f5e',
    },
  },
  M117: {
    title: 'Compétences en culture et art marocains',
    shortTitle: 'Culture & Art Marocains',
    color: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/30 dark:border-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
      glow: 'shadow-purple-500/10',
      accent: 'purple',
      hex: '#a855f7',
    },
  },
};

export const DEFAULT_MODULE_COLOR = {
  bg: 'bg-zinc-500/10 dark:bg-zinc-500/15',
  text: 'text-zinc-700 dark:text-zinc-300',
  border: 'border-zinc-500/30 dark:border-zinc-500/30',
  badge: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
  glow: 'shadow-zinc-500/10',
  accent: 'zinc',
  hex: '#71717a',
};
