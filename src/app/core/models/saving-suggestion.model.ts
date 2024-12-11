export interface SavingSuggestion {
  id?: string;
  title: string;
  message: string;
  type: 'category_alert' | 'unusual_spending' | 'saving_opportunity';
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  potentialSaving?: number;
  userId?: string;
  createdAt?: Date;
} 