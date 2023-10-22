import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sizeMB',
})
/** Convert file size in kb to MB (1 decimal place) */
export class SizeMBPipe implements PipeTransform {
  transform(value: number, ...args: any[]): any {
    const mb = value / 1024;
    return Math.round(mb * 10) / 10;
  }
}
