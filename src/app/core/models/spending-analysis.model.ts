export interface CategoryAnalysis {
  category: string;
  currentSpending: number;
  averageSpending: number;
  percentageChange: number;
  trend: 'increase' | 'decrease' | 'stable';
}

export interface UnusualSpending {
  category: string;
  amount: number;
  date: Date;
  description: string;
  percentageAboveAverage: number;
  categoryName: string;
}

export interface SavingSuggestion {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'category_alert' | 'unusual_spending' | 'saving_opportunity' | 'saving_suggestion';
  priority: 'high' | 'medium' | 'low';
  potentialSaving?: number;
  suggestedActions: string[];
  createdAt: Date;
  read?: boolean;
  category?: string;
  comparisonData?: {
    currentSpending: number;
    averageSpending: number;
    percentageChange: number;
  };
} 