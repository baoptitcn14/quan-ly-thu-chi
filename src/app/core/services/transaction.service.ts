import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  collectionData, 
  getDoc,
  Timestamp 
} from '@angular/fire/firestore';
import { Observable, of, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date | Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly collectionName = 'transactions';

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  getTransactions(): Observable<Transaction[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of([]);
    
    const transactionsRef = collection(this.firestore, this.collectionName);
    const transactionsQuery = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    return collectionData(transactionsQuery).pipe(
      map((transactions: any[]) => 
        transactions.map(t => ({
          ...t,
          date: this.convertToDate(t.date)
        })) as Transaction[]
      )
    );
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');
    
    const transactionsRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(transactionsRef, {
      ...transaction,
      userId,
      date: Timestamp.fromDate(this.convertToDate(transaction.date))
    });
    
    await updateDoc(docRef, {
      id: docRef.id
    });
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');

    const docRef = doc(this.firestore, this.collectionName, id);
    const updateData = { ...transaction };
    
    if (transaction.date) {
      updateData.date = Timestamp.fromDate(this.convertToDate(transaction.date));
    }
    
    await updateDoc(docRef, updateData);
  }

  private convertToDate(date: any): Date {
    if (!date) return new Date();
    
    if (date instanceof Date) return date;
    
    if (date?.toDate) return date.toDate();
    
    if (typeof date === 'string' || typeof date === 'number') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    return new Date();
  }

  async deleteTransaction(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }

  getTransactionsByCategory(category: string): Observable<Transaction[]> {
    const userId = this.authService.getCurrentUserId();
    const transactionsRef = collection(this.firestore, this.collectionName);
    const transactionsQuery = query(
      transactionsRef,
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('date', 'desc')
    );
    
    return collectionData(transactionsQuery) as Observable<Transaction[]>;
  }

  getTransaction(id: string): Observable<Transaction | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(getDoc(docRef)).pipe(
      map(doc => {
        if (doc.exists()) {
          const data = doc.data() as Transaction;
          return { ...data, id: doc.id };
        }
        return null;
      })
    );
  }
} 