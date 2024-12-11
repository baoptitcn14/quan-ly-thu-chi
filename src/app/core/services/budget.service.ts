import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  collectionData,
  Timestamp,
  getDocs,
} from '@angular/fire/firestore';
import { Observable, combineLatest, map, of, switchMap, firstValueFrom, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { TransactionService, Transaction } from './transaction.service';

export interface Budget {
  id?: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  spent?: number; // Số tiền đã chi
  remaining?: number; // Số tiền còn lại
  status?: 'normal' | 'warning' | 'exceeded'; // Trạng thái ngân sách
}

interface TransactionWithTimestamp extends Transaction {
  date: Date | Timestamp;
}

interface SpendingAnalytics {
  totalBudget: number;
  totalSpent: number;
  budgetUsagePercentage: number;
  categoryAnalytics: {
    categoryId: string;
    categoryName: string;
    budget: number;
    spent: number;
    remaining: number;
    usagePercentage: number;
    status: 'normal' | 'warning' | 'exceeded';
  }[];
  monthlyTrend: {
    month: string;
    totalSpent: number;
    budgetLimit: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class BudgetService implements OnDestroy {
  private readonly collectionName = 'budgets';
  private subscriptions = new Subscription();

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private transactionService: TransactionService
  ) {}

  getBudgets(): Observable<Budget[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of([]);

    const budgetsRef = collection(this.firestore, this.collectionName);
    const budgetsQuery = query(budgetsRef, where('userId', '==', userId));

    const subscription = collectionData(budgetsQuery, { idField: 'id' }).pipe(
      switchMap((budgets) => {
        const promises = this.calculateBudgetStatus(budgets as Budget[]);
        return Promise.all(promises).then((updatedBudgets) => {
          return updatedBudgets;
        });
      })
    );
    this.subscriptions.add(subscription);
    return subscription;
  }

  async addBudget(
    budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');

    const budgetRef = doc(collection(this.firestore, this.collectionName));
    
    // Tạo object mới và loại bỏ endDate nếu null hoặc undefined
    const budgetData = {
      ...budget,
      id: budgetRef.id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(budgetRef, budgetData);
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    
    budget.updatedAt = new Date();

    await setDoc(docRef, budget, { merge: true });
  }

  async deleteBudget(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }

  getBudgetByCategory(categoryId: string): Observable<Budget | null> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of(null);

    const budgetsRef = collection(this.firestore, this.collectionName);
    const budgetQuery = query(
      budgetsRef,
      where('userId', '==', userId),
      where('categoryId', '==', categoryId)
    );

    return collectionData(budgetQuery, { idField: 'id' }).pipe(
      switchMap(async (budgets: Budget[]) => {
        if (budgets.length === 0) return null;
        const budgetsWithStatus = await Promise.all(
          this.calculateBudgetStatus(budgets as Budget[])
        );
        return budgetsWithStatus[0];
      })
    );
  }

  private calculateSpentAmount(budget: Budget): Promise<number> {
    return firstValueFrom(this.transactionService
      .getTransactions()
      .pipe(
        map((transactions): number => {
          return (transactions as TransactionWithTimestamp[])
            .filter((t) => {
              // Kiểm tra giao dịch chi tiêu và danh mục
              if (t.type !== 'expense' || t.category !== budget.categoryId) {
                return false;
              }

              const transDate =
                t.date instanceof Date
                  ? t.date
                  : (t.date as Timestamp).toDate();
              const today = new Date();

              // Tính toán khoảng thời gian cho từng chu kỳ
              switch (budget.period) {
                case 'daily': {
                  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
                  return transDate >= startOfDay && transDate <= endOfDay;
                }

                case 'weekly': {
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  startOfWeek.setHours(0, 0, 0, 0);

                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  endOfWeek.setHours(23, 59, 59, 999);

                  return transDate >= startOfWeek && transDate <= endOfWeek;
                }

                case 'monthly': {
                  const startOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                  );
                  const endOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                    999
                  );
                  return transDate >= startOfMonth && transDate <= endOfMonth;
                }

                case 'yearly': {
                  const startOfYear = new Date(today.getFullYear(), 0, 1);
                  const endOfYear = new Date(
                    today.getFullYear(),
                    11,
                    31,
                    23,
                    59,
                    59,
                    999
                  );
                  return transDate >= startOfYear && transDate <= endOfYear;
                }

                default: {
                  const startDate = new Date(budget.startDate);
                  const endDate = budget.endDate
                    ? new Date(budget.endDate)
                    : new Date();
                  endDate.setHours(23, 59, 59, 999);
                  return transDate >= startDate && transDate <= endDate;
                }
              }
            })
            .reduce((sum, t) => sum + t.amount, 0);
        })
      ))
  }

  private calculateBudgetStatus(budgets: Budget[]): Promise<Budget>[] {
    return budgets.map(async (budget) => {
      const spent = await this.calculateSpentAmount(budget);
      const remaining = budget.amount - spent;
      const status = this.getBudgetStatus(spent, budget.amount);

      return {
        ...budget,
        spent,
        remaining,
        status,
      };
    });
  }

  private getBudgetStatus(
    spent: number,
    total: number
  ): 'normal' | 'warning' | 'exceeded' {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'normal';
  }

  async checkBudgetAlert(categoryId: string): Promise<boolean> {
    const budget = await firstValueFrom(this.getBudgetByCategory(categoryId));
    if (!budget) return false;
    return budget.status === 'warning' || budget.status === 'exceeded';
  }

  getSpendingAnalytics(): Observable<SpendingAnalytics> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of({
      totalBudget: 0,
      totalSpent: 0,
      budgetUsagePercentage: 0,
      categoryAnalytics: [],
      monthlyTrend: []
    });

    return this.getBudgets().pipe(
      switchMap(async (budgets) => {
        const analytics: SpendingAnalytics = {
          totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
          totalSpent: budgets.reduce((sum, b) => sum + (b.spent || 0), 0),
          budgetUsagePercentage: 0,
          categoryAnalytics: [],
          monthlyTrend: []
        };

        // Tính phần trăm sử dụng tổng thể
        analytics.budgetUsagePercentage = (analytics.totalSpent / analytics.totalBudget) * 100;

        // Phân tích theo danh mục
        analytics.categoryAnalytics = budgets.map(budget => ({
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          budget: budget.amount,
          spent: budget.spent || 0,
          remaining: budget.remaining || 0,
          usagePercentage: ((budget.spent || 0) / budget.amount) * 100,
          status: budget.status || 'normal'
        }));

        // Phân tích xu hướng theo tháng
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
        }).reverse();

        analytics.monthlyTrend = await Promise.all(
          last6Months.map(async (month) => {
            const totalSpent = await this.calculateMonthlySpending(month);
            const budgetLimit = budgets.reduce((sum, b) => {
              if (b.period === 'monthly') return sum + b.amount;
              if (b.period === 'yearly') return sum + (b.amount / 12);
              return sum;
            }, 0);

            return {
              month,
              totalSpent,
              budgetLimit
            };
          })
        );

        return analytics;
      })
    );
  }

  private async calculateMonthlySpending(monthYear: string): Promise<number> {
    const [month, year] = monthYear.split(' ');
    const transactions = await firstValueFrom(this.transactionService.getTransactions());
    
    return transactions
      .filter(t => {
        const transDate = t.date instanceof Date ? t.date : t.date.toDate();
        return t.type === 'expense' &&
               transDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' }) === monthYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getBudgetById(id: string): Observable<Budget | null> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of(null);

    return collectionData(
      query(collection(this.firestore, this.collectionName), 
      where('userId', '==', userId)), 
      { idField: 'id' }
    ).pipe(
      map((budgets: Budget[]) => budgets.find(b => b.id === id)),
      switchMap(async budget => {
        if (!budget) return null;
        const [budgetWithStatus] = await Promise.all(
          this.calculateBudgetStatus([budget as Budget])
        );
        return budgetWithStatus;
      })
    );
  }
}
