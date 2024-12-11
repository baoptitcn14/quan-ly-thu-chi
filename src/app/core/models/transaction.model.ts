import { Timestamp } from '@angular/fire/firestore';

export interface TransactionData {
  id?: string;
  userId: string;
  amount: number;
  category: string;
  date: any;
  description: string;
} 