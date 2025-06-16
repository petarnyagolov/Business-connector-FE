import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDateArray',
  standalone: true
})
export class FormatDateArrayPipe implements PipeTransform {
  transform(value: number[] | null | undefined): string {
    if (!value || value.length < 3) return '';
    // value: [YYYY, MM, DD, ...]
    const [year, month, day] = value;
    // Pad day/month to 2 digits
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    return `${d}.${m}.${year}`;
  }
}
