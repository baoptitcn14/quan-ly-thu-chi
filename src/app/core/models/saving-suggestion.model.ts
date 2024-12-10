export interface SavingSuggestion {
  id?: string;
  userId: string;
  type: 'overspending' | 'category_alert' | 'saving_goal';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  comparisonData?: {
    currentSpending: number;
    averageSpending: number;
    percentageIncrease: number;
  };
  suggestedActions: string[];
  createdAt: Date;
  read: boolean;
} 