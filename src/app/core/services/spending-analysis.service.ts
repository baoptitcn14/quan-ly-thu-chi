import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { SpendingItem, SpendingPatterns, UnusualSpending, SavingOpportunity } from '../models/spending.model';
import { CategoryService } from './category.service';
import { firstValueFrom } from 'rxjs';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

type ResponseType = 'chi_tieu_thang' | 'goi_y_tiet_kiem' | 'chi_tieu_bat_thuong' | 'default';

@Injectable({
  providedIn: 'root'
})
export class SpendingAnalysisService {
  private readonly UNUSUAL_SPENDING_THRESHOLD = 30;
  private model: tf.LayersModel | null = null;
  private categoryNames: {[key: string]: string} = {};

  constructor(
    private categoryService: CategoryService,
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.initModel();
    this.loadCategories();
  }

  private async loadCategories() {
    const categories = await firstValueFrom(this.categoryService.getCategories());
    this.categoryNames = categories.reduce((acc, cat) => ({
      ...acc,
      [(cat.id as string)]: cat.name
    }), {} as Record<string, string>);
  }

  private getCategoryName(categoryId: string): string {
    return this.categoryNames[categoryId] || 'Danh mục khác';
  }

  private async initModel() {
    try {
      this.model = await tf.loadLayersModel('assets/models/model.json');
    } catch (error) {
      console.warn('Không tìm thấy model, sử dụng phân tích đơn giản');
      this.model = null;
    }
  }

  async analyzeSpending(question: string, transactions: SpendingItem[]): Promise<string> {
    try {
      const patterns = await this.analyzeSpendingPatterns(transactions);
      const unusualSpendings = await this.detectUnusualSpendings(transactions);
      const savingOpportunities = this.identifySavingOpportunities(patterns);

      // Lưu suggestions vào database
      await this.saveSuggestions(savingOpportunities);

      if (!this.model) {
        return this.generateBasicResponse(question, {
          patterns,
          unusualSpendings,
          savingOpportunities
        });
      }

      return this.generateResponse(question, {
        patterns,
        unusualSpendings,
        savingOpportunities
      });
    } catch (error) {
      console.error('Lỗi khi phân tích:', error);
      return 'Xin lỗi, đã có lỗi xảy ra khi phân tích chi tiêu.';
    }
  }

  private identifySavingOpportunities(patterns: SpendingPatterns): SavingOpportunity[] {
    const opportunities: SavingOpportunity[] = [];
    const { categoryTrends } = patterns;

    Object.entries(categoryTrends).forEach(([categoryName, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + t.amount, 0);
      const average = total / transactions.length;

      if (total > average * 1.2) {
        opportunities.push({
          categoryName,
          potentialSaving: total - average,
          suggestion: this.getSavingSuggestion(categoryName)
        });
      }
    });

    return opportunities;
  }

  private getSavingSuggestion(category: string): string {
    const suggestions: { [key: string]: string } = {
      'food': 'Thử nấu ăn tại nhà thay vì ăn ngoài',
      'entertainment': 'Tìm các hoạt động giải trí miễn phí',
      'shopping': 'Lập danh sách mua sắm và tuân thủ nó',
      'default': 'Theo dõi chi tiêu và đặt hạn mức cho danh mục này'
    };

    return suggestions[category] || suggestions['default'];
  }

  private getWeekNumber(date: Date): string {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  }

  private getFrequentCategories(categoryTrends: { [key: string]: Array<{ amount: number, date: Date }> }): string[] {
    return Object.entries(categoryTrends)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([category]) => category);
  }

  private async analyzeSpendingPatterns(transactions: SpendingItem[]): Promise<SpendingPatterns> {
    const categoryTrends: { [key: string]: Array<{ amount: number, date: Date }> } = {};
    const weeklyPatterns: { [key: string]: number } = {};
    const monthlyTotals: { [key: string]: number } = {};
    
    transactions.forEach(t => {
      const categoryName = this.getCategoryName(t.category);
      if (!categoryTrends[categoryName]) {
        categoryTrends[categoryName] = [];
      }
      categoryTrends[categoryName].push({
        amount: t.amount,
        date: t.date
      });

      // Phân tích theo tuần
      const week = this.getWeekNumber(new Date(t.date));
      weeklyPatterns[week] = (weeklyPatterns[week] || 0) + t.amount;

      // Phân tích theo tháng 
      const month = new Date(t.date).getMonth().toString();
      monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
    });

    return {
      categoryTrends,
      weeklyPatterns,
      monthlyTotals,
      frequentCategories: Object.keys(categoryTrends)
    };
  }

  private generateResponse(question: string, analysis: {
    patterns: SpendingPatterns,
    unusualSpendings: UnusualSpending[],
    savingOpportunities: SavingOpportunity[]
  }): string {
    const responses: Record<ResponseType, () => string> = {
      'chi_tieu_thang': () => this.generateMonthlyAnalysis(analysis),
      'goi_y_tiet_kiem': () => this.generateSavingsSuggestions(analysis),
      'chi_tieu_bat_thuong': () => this.generateUnusualSpendingReport(analysis),
      'default': () => 'Xin lỗi, tôi không hiểu câu hỏi của bạn.'
    };

    const questionType = this.classifyQuestion(question) as ResponseType;
    return responses[questionType]();
  }

  private generateSavingsSuggestions(analysis: {
    patterns: SpendingPatterns,
    savingOpportunities: SavingOpportunity[]
  }): string {
    let response = '💡 Gợi ý tiết kiệm:\n\n';
    analysis.savingOpportunities.forEach(opportunity => {
      response += `- ${opportunity.categoryName}: Tiết kiệm ${this.formatMoney(opportunity.potentialSaving)}\n`;
      response += `  ${opportunity.suggestion}\n\n`;
    });
    return response;
  }

  private generateUnusualSpendingReport(analysis: {
    unusualSpendings: UnusualSpending[]
  }): string {
    let response = '⚠️ Chi tiêu bất thường:\n\n';
    analysis.unusualSpendings.forEach(spending => {
      response += `- ${spending.categoryName}: ${this.formatMoney(spending.amount)}\n`;
      response += `  Cao hơn trung bình ${Math.round(spending.percentageAboveAverage)}%\n`;
      response += `  Ngày: ${spending.date.toLocaleDateString('vi-VN')}\n\n`;
    });
    return response;
  }

  private classifyQuestion(question: string): string {
    const keywords = {
      chi_tieu_thang: ['phân tích', 'chi tiêu', 'tháng này'],
      goi_y_tiet_kiem: ['tiết kiệm', 'gợi ý', 'tiền'],
      chi_tieu_bat_thuong: ['bất thường', 'cao', 'nhiều']
    };

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => question.toLowerCase().includes(word))) {
        return type;
      }
    }
    return 'default';
  }

  private generateMonthlyAnalysis(analysis: {
    patterns: SpendingPatterns
  }): string {
    const { patterns } = analysis;
    let response = 'Phân tích chi tiêu tháng này của bạn:\n\n';

    // Thêm phân tích chi tiết
    const topCategories = this.getTopSpendingCategories(patterns.categoryTrends);
    response += `📊 Top danh mục chi tiêu:\n${topCategories.map(c => 
      `- ${c.categoryName}: ${this.formatMoney(c.total)}`
    ).join('\n')}\n\n`;

    // Thêm xu hướng
    response += '📈 Xu hướng chi tiêu:\n';
    response += this.analyzeTrends(patterns.categoryTrends);

    return response;
  }

  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  private async detectUnusualSpendings(transactions: SpendingItem[]): Promise<UnusualSpending[]> {
    const unusualSpendings: UnusualSpending[] = [];
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    for (const [categoryId, categoryTransactions] of Object.entries(categoryGroups)) {
      const categoryName = this.getCategoryName(categoryId);
      const averageAmount = this.calculateAverageTransactionAmount(categoryTransactions);

      categoryTransactions.forEach(transaction => {
        const percentageAboveAverage = ((transaction.amount - averageAmount) / averageAmount) * 100;
        
        if (percentageAboveAverage > this.UNUSUAL_SPENDING_THRESHOLD) {
          unusualSpendings.push({
            category: categoryId,
            categoryName,
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.note,
            percentageAboveAverage
          });
        }
      });
    }

    return unusualSpendings;
  }

  private groupTransactionsByCategory(transactions: SpendingItem[]): { [key: string]: SpendingItem[] } {
    return transactions.reduce((groups, transaction) => {
      const category = transaction.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
      return groups;
    }, {} as { [key: string]: SpendingItem[] });
  }

  private calculateAverageTransactionAmount(transactions: SpendingItem[]): number {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return total / transactions.length;
  }

  private getTopSpendingCategories(categoryTrends: { [key: string]: Array<{ amount: number, date: Date }> }) {
    const totals = Object.entries(categoryTrends).map(([categoryName, transactions]) => ({
      categoryName,
      total: transactions.reduce((sum, t) => sum + t.amount, 0)
    }));
    
    return totals.sort((a, b) => b.total - a.total).slice(0, 5); // Top 5 categories
  }

  private analyzeTrends(categoryTrends: { [key: string]: Array<{ amount: number, date: Date }> }): string {
    let trends = '';
    Object.entries(categoryTrends).forEach(([category, transactions]) => {
      const trend = this.calculateTrend(transactions);
      trends += `- ${category}: ${trend}\n`;
    });
    return trends;
  }

  private calculateTrend(transactions: Array<{ amount: number, date: Date }>): string {
    // Logic tính xu hướng tăng/giảm
    const sorted = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    const first = sorted[0]?.amount || 0;
    const last = sorted[sorted.length - 1]?.amount || 0;
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return '↗️ Tăng';
    if (change < -10) return '↘️ Giảm';
    return '→ Ổn định';
  }

  private generateBasicResponse(question: string, analysis: any): string {
    // Trả về phân tích cơ bản nếu không có model
    if (question.toLowerCase().includes('tiết kiệm')) {
      return this.generateSavingsSuggestions(analysis);
    }
    if (question.toLowerCase().includes('bất thường')) {
      return this.generateUnusualSpendingReport(analysis);
    }
    return this.generateMonthlyAnalysis(analysis);
  }

  private convertSpendingToText(spendingData: SpendingItem[]): string {
    return spendingData
      .map(item => {
        // Chuyển đổi date thành đối tượng Date nếu nó là string
        const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
        
        return `Vào ngày ${date.toLocaleDateString('vi-VN')}, chi ${item.amount} đồng cho ${item.category} với ghi chú: ${item.note}`;
      })
      .join('. ');
  }

  private async saveSuggestions(opportunities: SavingOpportunity[]): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const suggestionsRef = collection(this.firestore, 'suggestions');
    
    for (const opportunity of opportunities) {
      await addDoc(suggestionsRef, {
        userId,
        categoryName: opportunity.categoryName,
        potentialSaving: opportunity.potentialSaving,
        suggestion: opportunity.suggestion,
        createdAt: Timestamp.now(),
        status: 'active'
      });
    }
  }
}