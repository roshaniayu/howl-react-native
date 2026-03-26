export function formatTimeUnit(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  if (mins > 0 && secs > 0) {
    return `${formatTimeUnit(mins, 'min', 'mins')} ${formatTimeUnit(secs, 'sec', 'secs')}`;
  }

  if (mins > 0) {
    return formatTimeUnit(mins, 'min', 'mins');
  }

  return formatTimeUnit(secs, 'sec', 'secs');
}
