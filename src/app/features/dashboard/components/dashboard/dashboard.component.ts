import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import {
  TransactionService,
  Transaction,
} from '../../../../core/services/transaction.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

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
  ],
  template: `
    <div class="dashboard-container">
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
          <mat-card-header>
            <mat-icon color="primary">trending_up</mat-icon>
            <mat-card-title>Tổng thu</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="amount income">{{ totalIncome | number : '1.0-0' }}đ</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon color="warn">trending_down</mat-icon>
            <mat-card-title>Tổng chi</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="amount expense">{{ totalExpense | number : '1.0-0' }}đ</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon [color]="balance >= 0 ? 'primary' : 'warn'"
              >account_balance</mat-icon
            >
            <mat-card-title>Số dư</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p
              class="amount"
              [class.income]="balance >= 0"
              [class.expense]="balance < 0"
            >
              {{ balance | number : '1.0-0' }}đ
            </p>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="charts-container">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Biểu đồ thu chi theo tháng</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas
              baseChart
              [options]="barChartOptions"
              [type]="'bar'"
              [datasets]="barChartData.datasets"
              [labels]="barChartData.labels"
            >
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Phân bổ chi tiêu theo danh mục</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas
              baseChart
              [options]="pieChartOptions"
              [type]="'pie'"
              [datasets]="pieChartData.datasets"
              [labels]="pieChartData.labels"
            >
            </canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="recent-transactions">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Giao dịch gần đây</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="recentTransactions">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Ngày</th>
                <td mat-cell *matCellDef="let transaction">
                  {{ transaction.date | date : 'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Loại</th>
                <td mat-cell *matCellDef="let transaction">
                  <span
                    [class.income]="transaction.type === 'income'"
                    [class.expense]="transaction.type === 'expense'"
                  >
                    {{ transaction.type === 'income' ? 'Thu' : 'Chi' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Danh mục</th>
                <td mat-cell *matCellDef="let transaction">
                  {{ getCategoryLabel(transaction.category) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Số tiền</th>
                <td mat-cell *matCellDef="let transaction">
                  <span
                    [class.income]="transaction.type === 'income'"
                    [class.expense]="transaction.type === 'expense'"
                  >
                    {{ transaction.amount | number : '1.0-0' }}đ
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 1rem;

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;

          mat-card {
            mat-card-header {
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }

            mat-card-content {
              .amount {
                font-size: 1.5rem;
                font-weight: 500;
                margin: 1rem 0;

                &.income {
                  color: #4caf50;
                }
                &.expense {
                  color: #f44336;
                }
              }
            }
          }
        }

        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;

          @media (max-width: 768px) {
            grid-template-columns: 1fr;
          }

          .chart-card {
            min-height: 300px;
          }
        }

        .recent-transactions {
          table {
            width: 100%;

            .income {
              color: #4caf50;
            }
            .expense {
              color: #f44336;
            }
          }
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  totalIncome = 0;
  totalExpense = 0;
  balance = 0;
  recentTransactions: Transaction[] = [];
  displayedColumns = ['date', 'type', 'category', 'amount'];

  // Cấu hình cho biểu đồ cột
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      { label: 'Thu nhập', data: [], backgroundColor: '#4caf50' },
      { label: 'Chi tiêu', data: [], backgroundColor: '#f44336' },
    ],
  };

  // Cấu hình cho biểu đồ tròn
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  constructor(
    private transactionService: TransactionService,
    private budgetService: BudgetService
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  private loadTransactions() {
    this.transactionService.getTransactions().subscribe((transactions) => {
      // Cập nhật tổng thu chi
      this.totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      this.totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      this.balance = this.totalIncome - this.totalExpense;

      // Lấy 5 giao dịch gần nhất
      this.recentTransactions = transactions.slice(0, 5);

      // Cập nh��t dữ liệu biểu đồ
      this.updateChartData(transactions);
    });
  }

  private updateChartData(transactions: Transaction[]) {
    // Dữ liệu cho biểu đồ cột (thu chi theo tháng)
    const monthlyData = this.getMonthlyData(transactions);
    this.barChartData.labels = monthlyData.labels;
    this.barChartData.datasets[0].data = monthlyData.income;
    this.barChartData.datasets[1].data = monthlyData.expense;

    // Dữ liệu cho biểu đồ tròn (chi tiêu theo danh mục)
    const categoryData = this.getCategoryData(transactions);
    this.pieChartData.labels = categoryData.labels;
    this.pieChartData.datasets[0].data = categoryData.values;
  }

  private getMonthlyData(transactions: Transaction[]) {
    // Logic để tính toán dữ liệu theo tháng
    // Trả về { labels: string[], income: number[], expense: number[] }
    const monthlyData = {
      labels: [] as string[],
      income: [] as number[],
      expense: [] as number[],
    };

    // Lấy danh sách các tháng duy nhất từ giao dịch
    const months = [
      ...new Set(
        transactions.map((t) => {
          const date =
            t.date instanceof Date ? t.date : (t.date as any).toDate();
          return `T${date.getMonth() + 1}/${date.getFullYear()}`;
        })
      ),
    ].sort();

    // Khởi tạo mảng dữ liệu cho từng tháng
    months.forEach((month) => {
      monthlyData.labels.push(month);

      // Tính tổng thu cho tháng
      const monthlyIncome = transactions
        .filter((t) => {
          const date =
            t.date instanceof Date ? t.date : (t.date as any).toDate();
          return (
            `T${date.getMonth() + 1}/${date.getFullYear()}` === month &&
            t.type === 'income'
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyData.income.push(monthlyIncome);

      // Tính tổng chi cho tháng
      const monthlyExpense = transactions
        .filter((t) => {
          const date =
            t.date instanceof Date ? t.date : (t.date as any).toDate();
          return (
            `T${date.getMonth() + 1}/${date.getFullYear()}` === month &&
            t.type === 'expense'
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyData.expense.push(monthlyExpense);
    });

    return monthlyData;
  }

  private getCategoryData(transactions: Transaction[]) {
    // Logic để tính toán dữ liệu theo danh mục
    // Trả về { labels: string[], values: number[] }
    const categoryData = {
      labels: [] as string[],
      values: [] as number[],
    };

    // Lọc chỉ lấy các giao dịch chi tiêu
    const expenseTransactions = transactions.filter(
      (t) => t.type === 'expense'
    );

    // Tạo map để lưu tổng chi tiêu theo danh mục
    const categoryTotals = new Map<string, number>();

    // Tính tổng chi tiêu cho từng danh mục
    expenseTransactions.forEach((transaction) => {
      const categoryLabel = this.getCategoryLabel(transaction.category);
      const currentTotal = categoryTotals.get(categoryLabel) || 0;
      categoryTotals.set(categoryLabel, currentTotal + transaction.amount);
    });

    // Chuyển đổi map thành mảng labels và values
    categoryTotals.forEach((total, category) => {
      categoryData.labels.push(category);
      categoryData.values.push(total);
    });

    return categoryData;
  }

  getCategoryLabel(category: string): string {
    const categories: { [key: string]: string } = {
      food: 'Ăn uống',
      transport: 'Di chuyển',
      bills: 'Hóa đơn',
      entertainment: 'Giải trí',
      other: 'Khác',
    };
    return categories[category] || category;
  }
}
