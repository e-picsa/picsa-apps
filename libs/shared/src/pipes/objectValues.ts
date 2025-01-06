import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectValues',
  standalone: false,
})
/**
 * Take an object and return the Object.values() method on it
 * to convert into an array and populate an `_key` property
 */
export class ObjectValuesPipe implements PipeTransform {
  transform<T>(value: { [key: string]: T }): (T & { _key: string })[] {
    return Object.entries(value).map(([key, value]) => {
      return { ...value, _key: key };
    });
  }
}
