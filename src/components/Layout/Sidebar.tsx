import { NavLink } from 'react-router-dom';
import {
  UserRound,
  ClipboardList,
  Images,
  Target,
  FileEdit,
  BellRing,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    to: '/',
    label: '患者概览',
    Icon: UserRound,
  },
  {
    to: '/examination/E001',
    label: '检查记录',
    Icon: ClipboardList,
  },
  {
    to: '/annotation/E001',
    label: '影像标注',
    Icon: Images,
  },
  {
    to: '/lesion/E001',
    label: '病灶评估',
    Icon: Target,
  },
  {
    to: '/report/E001',
    label: '报告编辑',
    Icon: FileEdit,
  },
  {
    to: '/followup',
    label: '随访提醒',
    Icon: BellRing,
    badge: 5,
  },
  {
    to: '/quality',
    label: '质控看板',
    Icon: BarChart3,
  },
];

export default function Sidebar() {
  return (
    <aside
      className={cn(
        'w-[220px] shrink-0 h-full flex flex-col',
        'bg-white border-r border-neutral-200'
      )}
    >
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-teal-600' : 'text-neutral-500 group-hover:text-neutral-700'
                  )}
                />
                <span className="flex-1 truncate">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-5 h-5 px-1.5',
                      'rounded-full text-xs font-semibold',
                      isActive
                        ? 'bg-red-500 text-white'
                        : 'bg-red-50 text-red-600 group-hover:bg-red-100'
                    )}
                  >
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-4 border-t border-neutral-100">
        <div className="text-xs text-neutral-400 text-center">版本 v1.0.0</div>
      </div>
    </aside>
  );
}
