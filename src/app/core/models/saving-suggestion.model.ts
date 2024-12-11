export interface SavingSuggestion {
  id?: string;
  userId: string;
  type: 'category_alert' | 'unusual_spending' | 'saving_opportunity';
  title: string;
  message: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  potentialSaving: number;
  suggestedActions: string[];
  comparisonData?: {
    currentSpending: number;
    averageSpending: number;
    percentageChange: number;
  };
  createdAt: Date;
} 