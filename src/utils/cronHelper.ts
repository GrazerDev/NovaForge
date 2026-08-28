export interface CronPreset {
  label: string;
  expression: string;
  description: string;
  category: 'frequent' | 'hourly' | 'daily' | 'weekly' | 'custom';
}

export const CRON_PRESETS: CronPreset[] = [
  { label: 'Every 5 Minutes', expression: '*/5 * * * *', description: 'Runs every 5 minutes (GitHub Actions minimum recommended frequency)', category: 'frequent' },
  { label: 'Every 15 Minutes', expression: '*/15 * * * *', description: 'Runs every 15 minutes (Ideal for uptime monitoring)', category: 'frequent' },
  { label: 'Every 30 Minutes', expression: '*/30 * * * *', description: 'Runs every half hour', category: 'frequent' },
  { label: 'Every Hour', expression: '0 * * * *', description: 'Runs at the start of every hour (e.g. 1:00, 2:00, 3:00 UTC)', category: 'hourly' },
  { label: 'Every 6 Hours', expression: '0 */6 * * *', description: 'Runs 4 times per day (00:00, 06:00, 12:00, 18:00 UTC)', category: 'hourly' },
  { label: 'Every 12 Hours', expression: '0 */12 * * *', description: 'Runs twice a day (00:00 and 12:00 UTC)', category: 'hourly' },
  { label: 'Daily at 08:00 UTC', expression: '0 8 * * *', description: 'Every morning at 8:00 AM UTC (Morning announcements)', category: 'daily' },
  { label: 'Daily at 12:00 UTC', expression: '0 12 * * *', description: 'Every day at 12:00 PM UTC (Noon briefing)', category: 'daily' },
  { label: 'Daily at 00:00 UTC', expression: '0 0 * * *', description: 'Every midnight UTC (Daily maintenance & resets)', category: 'daily' },
  { label: 'Weekdays at 09:00 UTC', expression: '0 9 * * 1-5', description: 'Monday through Friday at 9:00 AM UTC', category: 'weekly' },
  { label: 'Weekly on Sunday at 00:00', expression: '0 0 * * 0', description: 'Every Sunday at midnight UTC (Weekly digests)', category: 'weekly' },
  { label: 'Monthly on the 1st', expression: '0 0 1 * *', description: 'First day of every month at midnight UTC', category: 'weekly' }
];

export function explainCron(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Invalid cron format (must have 5 fields: minute hour day month day-of-week)';
  }

  const [min, hour, day, month, dow] = parts;

  // Simple translations
  if (expression === '*/5 * * * *') return 'Every 5 minutes';
  if (expression === '*/15 * * * *') return 'Every 15 minutes';
  if (expression === '*/30 * * * *') return 'Every 30 minutes';
  if (expression === '0 * * * *') return 'Every hour on the hour';
  if (expression === '0 */6 * * *') return 'Every 6 hours';
  if (expression === '0 0 * * *') return 'Every day at midnight (00:00 UTC)';
  if (expression === '0 8 * * *') return 'Every day at 08:00 UTC';
  if (expression === '0 9 * * *') return 'Every day at 09:00 UTC';
  if (expression === '0 12 * * *') return 'Every day at 12:00 UTC';
  if (expression === '0 9 * * 1-5') return 'Every weekday (Mon–Fri) at 09:00 UTC';
  if (expression === '0 0 * * 0') return 'Every Sunday at 00:00 UTC';
  if (expression === '0 0 1 * *') return 'First day of every month at 00:00 UTC';

  let desc = `Minute: ${min}, Hour: ${hour}, Day: ${day}, Month: ${month}, DayOfWeek: ${dow} (UTC)`;
  return desc;
}

export function getSimulatedNextRuns(expression: string, count: number = 4): string[] {
  const runs: string[] = [];
  const now = new Date();
  
  // Basic deterministic forecast calculation for common patterns
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return ['Invalid cron format'];

  const [min, hour] = parts;

  if (min.startsWith('*/')) {
    const step = parseInt(min.replace('*/', ''), 10) || 15;
    let nextMin = Math.ceil(now.getUTCMinutes() / step) * step;
    let curr = new Date(now.getTime());
    curr.setUTCSeconds(0, 0);

    for (let i = 0; i < count; i++) {
      curr.setUTCMinutes(nextMin + (i * step));
      runs.push(curr.toUTCString().replace('GMT', 'UTC'));
    }
    return runs;
  }

  if (min === '0' && hour.startsWith('*/')) {
    const step = parseInt(hour.replace('*/', ''), 10) || 6;
    let curr = new Date(now.getTime());
    curr.setUTCMinutes(0, 0, 0);
    const currHour = curr.getUTCHours();
    const nextHour = Math.ceil((currHour + 1) / step) * step;
    curr.setUTCHours(nextHour);

    for (let i = 0; i < count; i++) {
      runs.push(curr.toUTCString().replace('GMT', 'UTC'));
      curr.setUTCHours(curr.getUTCHours() + step);
    }
    return runs;
  }

  if (min.match(/^\d+$/) && hour.match(/^\d+$/)) {
    const targetMin = parseInt(min, 10);
    const targetHour = parseInt(hour, 10);
    let curr = new Date(now.getTime());
    curr.setUTCMinutes(targetMin, 0, 0);
    curr.setUTCHours(targetHour);

    if (curr.getTime() <= now.getTime()) {
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    for (let i = 0; i < count; i++) {
      runs.push(curr.toUTCString().replace('GMT', 'UTC'));
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
    return runs;
  }

  // Fallback representation
  return [
    `Next run approximately based on schedule: ${expression}`,
    'GitHub Actions cron runs in UTC time zone.',
    'Note: GitHub Actions cron scheduling may experience slight queuing delays (1–5 mins) depending on runner load.'
  ];
}
