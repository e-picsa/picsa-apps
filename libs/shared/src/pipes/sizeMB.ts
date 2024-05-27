import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sizeMB',
  standalone: true,
})
/** Convert file size in kb to MB (1 decimal place) */
export class SizeMBPipe implements PipeTransform {
  transform(value: number, ...args: any[]): any {
    const mb = value / 1024;
    // round to 1 decimal place if less than 10MB
    const power = mb < 10 ? 10 : 1;
    return Math.round(mb * power) / power;
  }
}
