import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date, formatStr: string = 'dd/M/yyyy'): string {
  try {
    const d = new Date(date);
    if (formatStr === 'dd/M/yyyy') {
      // Custom format: dd/m/yyyy (single digit day/month without leading zero)
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateFnsFormat(d, formatStr);
  } catch {
    return String(date);
  }
}

export function formatDateDistance(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

