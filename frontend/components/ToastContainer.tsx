'use client';

import { Toast } from '@/lib/types';

interface Props { toasts: Toast[]; }

const typeStyles: Record<string, string> = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  info:    'border-purple-500/30 bg-purple-500/10 text-purple-300',
};

export default function ToastContainer({ toasts }: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`slide-in glass rounded-xl px-4 py-3 text-sm font-medium border ${typeStyles[t.type] ?? typeStyles.info}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
