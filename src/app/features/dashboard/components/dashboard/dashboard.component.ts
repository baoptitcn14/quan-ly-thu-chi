import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  TransactionService,
  Transaction,
} from '../../../../core/services/transaction.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { SavingGoalService, SavingGoal } from '../../../../core/services/saving-goal.service';
import { SavingSuggestionsComponent } from '../saving-suggestions/saving-suggestions.component';
import { SpendingAnalysisService } from '../../../../core/services/spending-analysis.service';
import { SpendingItem } from '../../../../core/models/spending.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    BaseChartDirective,
    MatProgressBarModule,
    SavingSuggestionsComponent,
  ],
  template: `
    <div class="dashboard-container">

    <app-saving-suggestions></app-saving-suggestions>
    
      <div class="header">
        <h2>Dashboard</h2>
        <button
          mat-raised-button
          color="primary"
          routerLink="/transactions/new"
        >
          <mat-icon>add</mat-icon>
          Thêm giao dịch
        </button>
      </div>

      <div class="summary-cards">
        <mat-card>
          <mat-card-content>
            <div class="summary-icon income">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="summary-info">
              <span class="label">Tổng thu tháng này</span>
              <span class="amount income">{{monthlyIncome | number:'1.0-0'}}đ</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="summary-icon expense">
              <mat-icon>trending_down</mat-icon>
            </div>
            <div class="summary-info">
              <span class="label">Tổng chi tháng này</span>
              <span class="amount expense">{{monthlyExpense | number:'1.0-0'}}đ</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="summary-icon balance">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="summary-info">
              <span class="label">Số dư</span>
              <span class="amount" [class.income]="balance >= 0" [class.expense]="balance < 0">
                {{balance | number:'1.0-0'}}đ
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="charts-section">
        <mat-card class="chart-card">
          <mat-card-header>
            <div class="card-header">
              <mat-icon color="primary">insert_chart</mat-icon>
              <h3>Biểu đồ thu chi</h3>
            </div>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [datasets]="barChartData.datasets"
              [labels]="barChartData.labels"
              [options]="barChartOptions"
              [type]="'bar'">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <div class="card-header">
              <mat-icon color="primary">pie_chart</mat-icon>
              <h3>Chi tiêu theo danh mục</h3>
            </div>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [datasets]="pieChartData.datasets"
              [labels]="pieChartData.labels"
              [options]="pieChartOptions"
              [type]="'doughnut'">
            </canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="transactions-card">
        <mat-card-header>
          <div class="card-header">
            <div class="title">
              <mat-icon color="primary">receipt_long</mat-icon>
              <h3>Giao dịch gần đây</h3>
            </div>
            <button mat-button color="primary" routerLink="/transactions">
              Xem tất cả
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="recentTransactions">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Ngày</th>
                <td mat-cell *matCellDef="let transaction">
                  {{transaction.date | date:'dd/MM/yyyy'}}
                </td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Loại</th>
                <td mat-cell *matCellDef="let transaction">
                  <span class="transaction-type" [class]="transaction.type">
                    {{transaction.type === 'income' ? 'Thu' : 'Chi'}}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Danh mục</th>
                <td mat-cell *matCellDef="let transaction">
                  {{transaction.categoryName}}
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Số tiền</th>
                <td mat-cell *matCellDef="let transaction" 
                    [class.income-amount]="transaction.type === 'income'"
                    [class.expense-amount]="transaction.type === 'expense'">
                  {{transaction.amount | number:'1.0-0'}}đ
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="goals-card">
        <mat-card-header>
          <div class="card-header">
            <div class="title">
              <mat-icon color="primary">savings</mat-icon>
              <h3>Mục tiêu tiết kiệm</h3>
            </div>
            <button mat-button color="primary" routerLink="/saving-goals">
              <span>Xem tất cả</span>
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="goals-grid">
            @for (goal of activeGoals; track goal.id) {
              <div class="goal-item" [class]="goal.status">
                <div class="goal-header">
                  <div class="goal-title">
                    <h4>{{goal.name}}</h4>
                    <div class="deadline">
                      <mat-icon>event</mat-icon>
                      <span>Còn {{goal.remainingDays}} ngày</span>
                    </div>
                  </div>
                  <div class="status-badge" [class]="goal.status">
                    {{goal.progress | number:'1.0-0'}}%
                  </div>
                </div>

                <div class="goal-progress">
                  <div class="progress-info">
                    <div class="current">
                      <span class="amount">{{goal.currentAmount | number:'1.0-0'}}đ</span>
                      <span class="label">Đã tiết kiệm</span>
                    </div>
                    <div class="target">
                      <span class="amount">{{goal.targetAmount | number:'1.0-0'}}đ</span>
                      <span class="label">Mục tiêu</span>
                    </div>
                  </div>

                  <mat-progress-bar
                    [value]="goal.progress"
                    [color]="getProgressColor(goal)"
                    mode="determinate">
                  </mat-progress-bar>

                  <div class="monthly-required">
                    <mat-icon>schedule</mat-icon>
                    <span>Cần tiết kiệm: <strong>{{goal.monthlyRequired | number:'1.0-0'}}đ/tháng</strong></span>
                  </div>
                </div>
              </div>
            }

            @if (activeGoals.length === 0) {
              <div class="no-goals">
                <mat-icon>savings</mat-icon>
                <p>Chưa có mục tiêu tiết kiệm nào</p>
                <button mat-stroked-button color="primary" routerLink="/saving-goals/new">
                  <mat-icon>add</mat-icon>
                  <span>Thêm mục tiêu mới</span>
                </button>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 1rem;
        max-width: 1400px;
        margin: 0 auto;
        display: grid;
        gap: 1.5rem;
        overflow-x: hidden;
        position: relative;
        height: 100%;
      }

      .chat-fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 100;
    }

    .ai-chat-dialog {
      position: fixed;
      bottom: 5rem;
      right: 2rem;
      width: 400px;
      z-index: 99;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }

      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;

        mat-card {
          mat-card-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;

            .summary-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border-radius: 12px;

              &.income {
                background: rgba(76, 175, 80, 0.1);
                color: #4caf50;
              }
              &.expense {
                background: rgba(244, 67, 54, 0.1);
                color: #f44336;
              }
              &.balance {
                background: rgba(33, 150, 243, 0.1);
                color: #2196f3;
              }

              mat-icon {
                font-size: 24px;
                width: 24px;
                height: 24px;
              }
            }

            .summary-info {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;

              .label {
                color: #666;
                font-size: 0.875rem;
              }

              .amount {
                font-size: 1.5rem;
                font-weight: 500;

                &.income { color: #4caf50; }
                &.expense { color: #f44336; }
              }
            }
          }
        }
      }

      .charts-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;

        .chart-card {
          width: 100%;
          min-height: 350px;
          overflow: hidden;

          mat-card-content {
            padding: 1rem;
            canvas {
              width: 100% !important;
              height: 300px !important;
            }
          }
        }
      }

      .transactions-card {
        width: 100%;
        overflow-x: auto;

        .table-container {
          min-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;

          table {
            width: 100%;

            th, td {
              white-space: nowrap;
              padding: 0.5rem 1rem;
            }

            .mat-column-date { min-width: 100px; }
            .mat-column-type { min-width: 80px; }
            .mat-column-category { min-width: 120px; }
            .mat-column-amount { 
              min-width: 100px;
              text-align: right; 
            }

            .income-amount {
              color: #4caf50;
              font-weight: 500;
            }

            .expense-amount {
              color: #f44336;
              font-weight: 500;
            }
          }
        }
      }

      .goals-card {
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.25rem;
          padding: 1rem;

          .goal-item {
            background: #fff;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-left: 4px solid #2196f3;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            }

            &.completed { border-left-color: #4caf50; }
            &.warning { border-left-color: #ff9800; }
            &.failed { border-left-color: #f44336; }

            .goal-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 1.5rem;

              .goal-title {
                h4 {
                  margin: 0 0 0.5rem;
                  font-size: 1.1rem;
                  font-weight: 500;
                  color: #333;
                }

                .deadline {
                  display: flex;
                  align-items: center;
                  gap: 0.25rem;
                  color: #666;
                  font-size: 0.875rem;

                  mat-icon {
                    font-size: 16px;
                    width: 16px;
                    height: 16px;
                  }
                }
              }

              .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 500;
                background: rgba(33, 150, 243, 0.1);
                color: #2196f3;

                &.completed { 
                  background: rgba(76, 175, 80, 0.1);
                  color: #4caf50;
                }
                &.warning { 
                  background: rgba(255, 152, 0, 0.1);
                  color: #ff9800;
                }
                &.failed { 
                  background: rgba(244, 67, 54, 0.1);
                  color: #f44336;
                }
              }
            }

            .goal-progress {
              .progress-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;

                .current, .target {
                  display: flex;
                  flex-direction: column;
                  align-items: flex-start;

                  .amount {
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #333;
                    margin-bottom: 0.25rem;
                  }

                  .label {
                    font-size: 0.75rem;
                    color: #666;
                  }
                }
              }

              mat-progress-bar {
                height: 6px;
                border-radius: 3px;
                margin-bottom: 1rem;
              }

              .monthly-required {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #666;
                font-size: 0.875rem;

                mat-icon {
                  font-size: 16px;
                  width: 16px;
                  height: 16px;
                }

                strong {
                  color: #2196f3;
                }
              }
            }
          }

          .no-goals {
            grid-column: 1 / -1;
            text-align: center;
            padding: 3rem 1rem;
            background: #f8f9fa;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;

            mat-icon {
              font-size: 48px;
              width: 48px;
              height: 48px;
              color: #666;
            }

            p {
              margin: 0;
              color: #666;
            }

            button {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem 1rem;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: 0.5rem;
          gap: 1rem;
        }

        .summary-cards {
          grid-template-columns: 1fr;
        }

        .charts-section {
          grid-template-columns: 1fr;

          .chart-card {
            min-height: 300px;
            mat-card-content {
              padding: 0.5rem;
              canvas {
                height: 250px !important;
              }
            }
          }
        }

        .transactions-card {
          mat-card-content {
            padding: 0;
          }

          .table-container {
            margin: 0;
            padding: 0 0.5rem;

            table {
              th, td {
                padding: 0.5rem;
                font-size: 0.875rem;
              }
            }
          }
        }

        .goals-grid {
          grid-template-columns: 1fr !important;
          padding: 0.75rem !important;
          gap: 1rem !important;

          .goal-item {
            padding: 1.25rem !important;

            .goal-header {
              margin-bottom: 1.25rem !important;
            }

            .goal-progress {
              .progress-info {
                .current, .target {
                  .amount {
                    font-size: 1rem !important;
                  }
                }
              }
            }
          }
        }

        .card-header {
          padding: 1rem;
          
          h3 {
            font-size: 1.1rem;
          }
        }
      }

      @media (max-width: 480px) {
        .dashboard-container {
          padding: 0.25rem;
        }

        .summary-cards {
          mat-card {
            mat-card-content {
              padding: 1rem;
              
              .summary-icon {
                width: 40px;
                height: 40px;
              }

              .summary-info {
                .amount {
                  font-size: 1.25rem;
                }
              }
            }
          }
        }

        .transactions-card {
          .table-container {
            table {
              th, td {
                padding: 0.25rem 0.5rem;
                font-size: 0.8125rem;
              }
            }
          }
        }

        .goals-grid {
          padding: 0.5rem !important;

          .goal-item {
            padding: 1rem !important;

            .goal-header {
              flex-direction: column;
              gap: 0.75rem;

              .status-badge {
                align-self: flex-start;
              }
            }

            .goal-progress {
              .monthly-required {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.25rem;
              }
            }
          }
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  monthlyIncome = 0;
  monthlyExpense = 0;
  balance = 0;
  recentTransactions: Transaction[] = [];
  displayedColumns = ['date', 'type', 'category', 'amount'];
  categories: Category[] = [];
  activeGoals: SavingGoal[] = [];

  // Cấu hình biểu đồ cột
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Thu',
        data: [],
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
        borderWidth: 1
      },
      {
        label: 'Chi',
        data: [],
        backgroundColor: '#f44336',
        borderColor: '#f44336',
        borderWidth: 1
      }
    ]
  };

  // Cấu hình biểu đồ tròn
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 12 },
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: ${value.toLocaleString('vi-VN')}đ (${percentage}%)`;
          }
        }
      }
    }
  };

  pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56',
        '#4BC0C0', '#9966FF', '#FF9F40'
      ],
      hoverOffset: 4
    }]
  };

  constructor(
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private savingGoalService: SavingGoalService,
    private spendingAnalysisService: SpendingAnalysisService
  ) { }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadCategories();
    this.loadSavingGoals();
  }

  private loadTransactions(): void {
    this.transactionService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.recentTransactions = transactions.slice(0, 5);
        this.calculateTotals(transactions);
        this.updateChartData(transactions);
      });
  }

  private calculateTotals(transactions: Transaction[]): void {
    this.monthlyIncome = this.sumTransactionsByType(transactions, 'income');
    this.monthlyExpense = this.sumTransactionsByType(transactions, 'expense');
    this.balance = this.monthlyIncome - this.monthlyExpense;
  }

  private sumTransactionsByType(transactions: Transaction[], type: 'income' | 'expense'): number {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private updateChartData(transactions: Transaction[]): void {
    const monthlyData = this.getMonthlyData(transactions);
    this.updateBarChartData(monthlyData);

    const categoryData = this.getCategoryData(transactions);
    this.updatePieChartData(categoryData);
  }

  private updateBarChartData(monthlyData: any): void {
    this.barChartData.labels = monthlyData.labels;
    this.barChartData.datasets[0].data = monthlyData.income;
    this.barChartData.datasets[1].data = monthlyData.expense;
  }

  private updatePieChartData(categoryData: any): void {
    this.pieChartData.labels = categoryData.labels;
    this.pieChartData.datasets[0].data = categoryData.values;
  }

  private getMonthlyData(transactions: Transaction[]) {
    const monthlyData = {
      labels: [] as string[],
      income: [] as number[],
      expense: [] as number[]
    };

    const last6Months = this.getLast6Months();
    monthlyData.labels = last6Months;

    last6Months.forEach(month => {
      const monthTransactions = this.filterTransactionsByMonth(transactions, month);
      monthlyData.income.push(this.sumTransactionsByType(monthTransactions, 'income'));
      monthlyData.expense.push(this.sumTransactionsByType(monthTransactions, 'expense'));
    });

    return monthlyData;
  }

  private getLast6Months(): string[] {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
    }).reverse();
  }

  private filterTransactionsByMonth(transactions: Transaction[], month: string): Transaction[] {
    return transactions.filter(t => {
      const transDate = t.date instanceof Date ? t.date : t.date.toDate();
      return transDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' }) === month;
    });
  }

  private getCategoryData(transactions: Transaction[]) {
    const currentMonth = new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
    const monthTransactions = this.filterTransactionsByMonth(transactions, currentMonth)
      .filter(t => t.type === 'expense');

    const categoryTotals = this.groupTransactionsByCategory(monthTransactions);
    const sortedCategories = this.getSortedCategories(categoryTotals);

    return {
      labels: sortedCategories.map(([cat]) => cat),
      values: sortedCategories.map(([_, val]) => val)
    };
  }

  private groupTransactionsByCategory(transactions: Transaction[]): Map<string, number> {
    return transactions.reduce((totals, t) => {
      const current = totals.get(t.categoryName) || 0;
      totals.set(t.categoryName, current + t.amount);
      return totals;
    }, new Map<string, number>());
  }

  private getSortedCategories(totals: Map<string, number>): [string, number][] {
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }

  private loadCategories(): void {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  private loadSavingGoals(): void {
    this.savingGoalService.getSavingGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe(goals => {
        this.activeGoals = goals
          .filter(g => g.status === 'active')
          .slice(0, 4);
      });
  }

  getProgressColor(goal: SavingGoal): string {
    const progress = goal.progress ?? 0;
    return progress >= 100 ? 'primary' :
      progress >= 80 ? 'accent' :
        'primary';
  }

  async analyzeAndSuggest(): Promise<void> {
    try {
      const spendingItems: SpendingItem[] = this.recentTransactions.map(t => ({
        amount: t.amount,
        category: t.categoryName,
        date: t.date instanceof Date ? t.date : t.date.toDate(),
        note: t.description || ''
      }));

      const analysis = await this.spendingAnalysisService.analyzeSpending(
        'Phân tích chi tiêu',
        spendingItems
      );

      console.log('Kết quả phân tích:', analysis);
      // TODO: Hiển thị kết quả phân tích trong UI

    } catch (error) {
      console.error('Lỗi khi phân tích chi tiêu:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
