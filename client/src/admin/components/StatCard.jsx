import { Card } from '@/components/ui/card';

const StatCard = ({ title, value, icon: Icon, change, changeType = 'up', color = 'blue' }) => {
  const colors = {
    blue: { bg: 'bg-chart-1/10', icon: 'text-chart-1' },
    green: { bg: 'bg-chart-2/10', icon: 'text-chart-2' },
    yellow: { bg: 'bg-chart-3/10', icon: 'text-chart-3' },
    purple: { bg: 'bg-chart-4/10', icon: 'text-chart-4' },
    red: { bg: 'bg-destructive/10', icon: 'text-destructive' },
    primary: { bg: 'bg-primary/10', icon: 'text-primary' },
  };
  const c = colors[color] || colors.blue;

  return (
    <Card className="border-border p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`${c.bg} p-3 rounded-xl flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-card-foreground mt-1 tabular-nums">{value}</p>
        {change && (
          <p className={`text-xs mt-1 font-semibold ${changeType === 'up' ? 'text-chart-2' : 'text-destructive'}`}>
            {changeType === 'up' ? '↑' : '↓'} {change} from last month
          </p>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
