export interface SpendingItem {
  amount: number;
  category: string;
  date: Date;
  note: string;
}

export interface SpendingPatterns {
  categoryTrends: { [key: string]: Array<{ amount: number, date: Date }> };
  weeklyPatterns: { [key: string]: number };
  monthlyTotals: { [key: string]: number };
  frequentCategories: string[];
}

export interface UnusualSpending {
  category: string;
  amount: number;
  date: Date;
  description: string;
  percentageAboveAverage: number;
  categoryName: string;
}

export interface SavingOpportunity {
  categoryName: string;
  potentialSaving: number;
  suggestion: string;
} 