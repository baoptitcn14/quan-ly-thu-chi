import { Firestore } from "@angular/fire/firestore";
import { AuthService } from "./auth.service";
import { NotificationService } from "./notification.service";
import { Injectable } from "@angular/core";

interface SavingSuggestion {
  type: 'category_alert' | 'overspending' | 'saving_goal';
  title: string;
  message: string;
  category?: string;
  comparisonData?: {
    currentSpending: number;
    averageSpending: number;
    percentageIncrease: number;
  };
  suggestedActions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SpendingAnalysisService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async analyzeSpendings() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    // Phân tích chi tiêu theo danh mục
    const categoryAnalysis = await this.analyzeByCategory();
    
    // Phát hiện chi tiêu bất thường
    const unusualSpendings = await this.detectUnusualSpendings();
    
    // Tạo gợi ý tiết kiệm
    await this.generateSuggestions(categoryAnalysis, unusualSpendings);
  }

  private async analyzeByCategory() {
    // Tính toán chi tiêu trung bình theo danh mục
    // So sánh với tháng trước
    // Phát hiện danh mục tăng đột biến
  }

  private async detectUnusualSpendings() {
    // Phát hiện các khoản chi tiêu cao bất thường
    // So sánh với mức chi tiêu thông thường
    // Xác định ngưỡng cảnh báo
  }

  private async generateSuggestions(categoryAnalysis: any, unusualSpendings: any) {
    const suggestions = [];

    // Gợi ý dựa trên phân tích danh mục
    if (categoryAnalysis.food > categoryAnalysis.avgFood * 1.3) {
      suggestions.push({
        type: 'category_alert' as const,
        title: 'Chi tiêu ăn uống cao',
        message: 'Chi tiêu ăn uống tháng này cao hơn 30% so với bình thường',
        category: 'food',
        comparisonData: {
          currentSpending: categoryAnalysis.food,
          averageSpending: categoryAnalysis.avgFood,
          percentageIncrease: 30
        },
        suggestedActions: [
          'Hạn chế ăn ngoài',
          'Lên kế hoạch nấu ăn ở nhà',
          'Tận dụng khuyến mãi'
        ]
      });
    }

    // Gợi ý dựa trên chi tiêu bất thường
    unusualSpendings.forEach((spending: any) => {
      suggestions.push({
        type: 'overspending' as const,
        title: 'Chi tiêu bất thường',
        message: `Phát hiện khoản chi ${spending.amount}đ cho ${spending.category}`,
        amount: spending.amount,
        suggestedActions: [
          'Xem xét lại mức độ cần thiết',
          'Tìm kiếm lựa chọn tiết kiệm hơn',
          'Đặt hạn mức chi tiêu cho danh mục này'
        ]
      });
    });

    // Gửi thông báo cho người dùng
    suggestions.forEach(suggestion => {
      this.notificationService.sendSavingSuggestion(suggestion);
    });
  }
} 