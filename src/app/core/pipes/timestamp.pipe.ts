import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'TimestampPipe',
  standalone: true
})
export class TimestampPipe implements PipeTransform {
  transform(value: Timestamp | Date): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    return value;
  }
} 