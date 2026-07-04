export function formatMs(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function statusEmoji(status: string): string {
  switch (status) {
    case 'locked-in': return '🟢';
    case 'mog-pending': return '🟡';
    case 'mog-certified': return '📸';
    case 'mog-failed': return '🔴';
    case 'on-break': return '☕';
    default: return '⚪';
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'locked-in': return 'Locked In';
    case 'mog-pending': return 'Mog Check Pending';
    case 'mog-certified': return 'Mog Certified';
    case 'mog-failed': return 'Failed Mog Check';
    case 'on-break': return 'On Break';
    default: return 'Unknown';
  }
}

export function auraColor(aura: number): string {
  if (aura >= 100) return 'text-yellow-300';
  if (aura >= 50) return 'text-green-400';
  if (aura >= 0) return 'text-blue-300';
  return 'text-red-400';
}
