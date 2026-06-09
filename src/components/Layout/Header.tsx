import { Stethoscope, Bell, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  return (
    <header
      className={cn(
        'h-14 w-full flex items-center justify-between px-6',
        'bg-white border-b border-neutral-200',
        'shrink-0 z-20'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold text-neutral-900">
            消化内镜辅助诊疗系统
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">姓名</span>
            <span className="font-medium text-neutral-900">张建国</span>
          </div>
          <div className="w-px h-4 bg-neutral-200" />
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">性别</span>
            <span className="font-medium text-neutral-900">男</span>
          </div>
          <div className="w-px h-4 bg-neutral-200" />
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">年龄</span>
            <span className="font-medium text-neutral-900">58岁</span>
          </div>
          <div className="w-px h-4 bg-neutral-200" />
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">ID号</span>
            <span className="font-medium text-neutral-900 font-mono">P001</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            'text-neutral-600 hover:bg-neutral-100 transition-colors'
          )}
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          type="button"
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            'text-neutral-600 hover:bg-neutral-100 transition-colors'
          )}
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-neutral-200 mx-1" />
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center',
              'border border-teal-100'
            )}
          >
            <User className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-neutral-900">陈主任</span>
            <span className="text-xs text-neutral-500">消化内科</span>
          </div>
        </div>
      </div>
    </header>
  );
}
