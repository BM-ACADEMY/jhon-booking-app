import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

const StatCard = React.memo(({ title, value, icon: Icon, change, changeType = 'up', subtitle, description, color = 'blue' }) => {
  const isUp = changeType === 'up';

  const iconStyles = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
  };

  const style = iconStyles[color] || iconStyles.blue;

  return (
    <Card className="border border-border bg-card p-5 shadow-xs flex flex-col justify-between rounded-xl">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${style}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground tracking-wide truncate">{title}</span>
        </div>

        {change !== undefined && change !== null && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              isUp
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isUp ? '+' : ''}{change}%
          </span>
        )}
      </div>

      {/* Main Number Metric */}
      <div className="mt-3">
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</h3>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{subtitle || (isUp ? 'Trending up' : 'Down this period')}</span>
        {description && <span className="text-[10px] text-muted-foreground/80 shrink-0 ml-1">{description}</span>}
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
