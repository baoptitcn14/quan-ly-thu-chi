import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  collectionData 
} from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { AuthService } from './auth.service';
import { TransactionService, Transaction } from './transaction.service';
import { Timestamp } from '@angular/fire/firestore';

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly collectionName = 'budgets';

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private transactionService: TransactionService
  ) {}

  getBudgets(): Observable<Budget[]> {
    const userId = this.authService.getCurrentUserId();
    const budgetsRef = collection(this.firestore, this.collectionName);
    const budgetsQuery = query(
      budgetsRef,
      where('userId', '==', userId)
    );
    
    return collectionData(budgetsQuery) as Observable<Budget[]>;
  }

  async setBudget(budget: Budget): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');
    
    const budgetId = budget.id || this.generateBudgetId(budget.category);
    const docRef = doc(this.firestore, this.collectionName, budgetId);
    
    await setDoc(docRef, {
      ...budget,
      userId,
      startDate: new Date(budget.startDate)
    });
  }

  checkBudgetAlert(category: string): Observable<boolean> {
    return combineLatest([
      this.getBudgetByCategory(category),
      this.transactionService.getTransactionsByCategory(category)
    ]).pipe(
      map(([budget, transactions]) => {
        if (!budget) return false;
        
        const totalSpent = this.calculateTotalSpent(transactions, budget.period);
        return totalSpent >= budget.amount;
      })
    );
  }

  private getBudgetByCategory(category: string): Observable<Budget | null> {
    const userId = this.authService.getCurrentUserId();
    const budgetsRef = collection(this.firestore, this.collectionName);
    const budgetQuery = query(
      budgetsRef,
      where('userId', '==', userId),
      where('category', '==', category)
    );
    
    return collectionData(budgetQuery).pipe(
      map((budgets: any) => budgets[0] as Budget || null)
    );
  }

  private calculateTotalSpent(transactions: Transaction[], period: 'daily' | 'weekly' | 'monthly'): number {
    const now = new Date();
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = t.date instanceof Date ? t.date : (t.date as Timestamp).toDate();
      
      switch (period) {
        case 'daily':
          return transactionDate.toDateString() === now.toDateString();
        case 'weekly':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          return transactionDate >= weekAgo;
        case 'monthly':
          return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
      }
    });

    return filteredTransactions.reduce((total, t) => total + t.amount, 0);
  }

  private generateBudgetId(category: string): string {
    const userId = this.authService.getCurrentUserId();
    return `${userId}_${category}`;
  }
} 