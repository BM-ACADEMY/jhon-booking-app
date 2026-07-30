import { Card } from '@/components/ui/card';

const StatCard = ({ title, value, icon: Icon, change, changeType = 'up', color = 'blue' }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    primary: { bg: 'bg-primary-50', icon: 'text-primary-600', border: 'border-primary-100' },
  };
  const c = colors[color] || colors.blue;

  return (
    <Card className={`${c.border} p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all`}>
      <div className={`${c.bg} p-3 rounded-xl flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className={`text-xs mt-1 font-semibold ${changeType === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {changeType === 'up' ? '↑' : '↓'} {change} from last month
          </p>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
