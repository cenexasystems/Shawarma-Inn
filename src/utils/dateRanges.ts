export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  this_year: 'This Year',
  custom: 'Custom Range',
};

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  'today',
  'yesterday',
  'last_7_days',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'last_3_months',
  'last_6_months',
  'this_year',
];

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const startOfWeek = (d: Date) => {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
  copy.setDate(diff);
  return startOfDay(copy);
};

export function getRangeForPreset(preset: DateRangePreset, customRange?: DateRange): DateRange {
  if (preset === 'custom') {
    if (customRange) return customRange;
    const now = new Date();
    return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  }

  const now = new Date();

  switch (preset) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };

    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { from: startOfDay(yesterday).toISOString(), to: endOfDay(yesterday).toISOString() };
    }

    case 'last_7_days': {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      return { from: startOfDay(past).toISOString(), to: endOfDay(now).toISOString() };
    }

    case 'this_week': {
      const from = startOfWeek(now);
      return { from: from.toISOString(), to: endOfDay(now).toISOString() };
    }

    case 'last_week': {
      const thisWeekStart = startOfWeek(now);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
      return { from: startOfDay(lastWeekStart).toISOString(), to: endOfDay(lastWeekEnd).toISOString() };
    }

    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
    }

    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from).toISOString(), to: endOfDay(to).toISOString() };
    }

    case 'last_3_months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
    }

    case 'last_6_months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
    }

    case 'this_year': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
    }

    default:
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  }
}
