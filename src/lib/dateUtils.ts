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
