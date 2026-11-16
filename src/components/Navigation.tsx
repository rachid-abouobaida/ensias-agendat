'use client';

import { Calendar, CheckSquare, Edit3 } from 'lucide-react';

export type TabType = 'week' | 'tasks' | 'edit';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingTasksCount?: number;
}

export function Navigation({
  activeTab,
  onTabChange,
  pendingTasksCount = 0,
}: NavigationProps) {
  const tabs = [
    {
      id: 'week' as TabType,
      label: 'Semaine',
      icon: Calendar,
    },
    {
      id: 'tasks' as TabType,
      label: 'Tâches',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    {
      id: 'edit' as TabType,
      label: 'Édition EDT',
      icon: Edit3,
    },
  ];

  return (
    <>
      {/* Desktop Navigation Tabs (shown below Header on large screens) */}
      <div className="hidden sm:block w-full border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-sm px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-1 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb friendly, safe area padded) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 transition-colors">
        <div className="grid grid-cols-3 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-300 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center shadow-md">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
