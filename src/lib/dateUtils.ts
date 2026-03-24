import { format, subDays } from 'date-fns';

export const getDefaultReportDate = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // If before 7 AM, use yesterday's date
  if (hour < 7) {
    return format(subDays(now, 1), 'yyyy-MM-dd');
  }
  
  return format(now, 'yyyy-MM-dd');
};

export const getDefaultFilterRange = () => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  return {
    start: format(yesterday, 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd')
  };
};
