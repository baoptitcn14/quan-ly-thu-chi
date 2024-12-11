import { Injectable } from "@angular/core";
import { SpendingAnalysisService } from './spending-analysis.service';
import { AnalysisStateService } from './analysis-state.service';
import { AuthService } from "./auth.service";
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { Firestore, collection, query, where, onSnapshot, orderBy } from '@angular/fire/firestore';
import { SavingSuggestion } from "../models/saving-suggestion.model";
import { TransactionService } from './transaction.service';
import { TransactionData } from '../models/transaction.model';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AnalysisManagerService {
  private suggestionsSubject = new BehaviorSubject<SavingSuggestion[]>([]);
  suggestions$ = this.suggestionsSubject.asObservable();
  private unsubscribe: (() => void) | null = null;

  constructor(
    private spendingAnalysisService: SpendingAnalysisService,
    private analysisState: AnalysisStateService,
    private authService: AuthService,
    private firestore: Firestore,
    private transactionService: TransactionService
  ) {}

  private async getTransactions(): Promise<TransactionData[]> {
    const transactions = await firstValueFrom(this.transactionService.getTransactions());
    return (transactions || []).map(t => ({
      category: t.category,
      amount: t.amount,
      date: t.date instanceof Timestamp ? t.date.toDate() : t.date,
      description: t.description,
      userId: t.userId
    })) as TransactionData[];
  }

  async startAnalysis() {
    this.analysisState.setAnalyzing(true);
    const transactions = await this.getTransactions();
    const spendingItems = transactions.map(t => ({
      date: t.date.toISOString(),
      amount: t.amount,
      category: t.category,
      note: t.description || ''  // Sử dụng description làm note
    }));
    return this.spendingAnalysisService.analyzeSpending(
      "Phân tích chi tiêu và đưa ra gợi ý tiết kiệm", 
      spendingItems
    ).finally(() => {
      this.analysisState.setAnalyzing(false);
    });
  }

  startRealtimeSuggestions(userId: string): void {
    const suggestionsRef = collection(this.firestore, 'suggestions');
    const q = query(
      suggestionsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const suggestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavingSuggestion[];
      this.suggestionsSubject.next(suggestions);
    });
  }

  stopRealtimeSuggestions(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
} 
