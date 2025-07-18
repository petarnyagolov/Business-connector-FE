import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDateArray',
  standalone: true
})
export class FormatDateArrayPipe implements PipeTransform {
  transform(value: number[] | Date | string | null | undefined): string {
    if (!value) return '';
    
    // Ако е Date обект
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0'); // getMonth() е 0-based
      const year = value.getFullYear();
      return `${day}.${month}.${year}`;
    }
    
    // Ако е ISO string
    if (typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}.${month}.${year}`;
        }
      } catch (e) {
        console.warn('Could not parse date string:', value);
        return '';
      }
    }
    
    // Ако е масив от числа [YYYY, MM, DD, ...]
    if (Array.isArray(value) && value.length >= 3) {
      const [year, month, day] = value;
      // Pad day/month to 2 digits
      const d = String(day).padStart(2, '0');
      const m = String(month).padStart(2, '0');
      return `${d}.${m}.${year}`;
    }
    
    return '';
  }
}
