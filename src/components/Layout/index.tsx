import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={cn('h-screen w-screen flex flex-col overflow-hidden')}>
      <Header />
      <div className={cn('flex-1 flex overflow-hidden')}>
        <Sidebar />
        <main
          className={cn(
            'flex-1 overflow-auto',
            'bg-neutral-50'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
