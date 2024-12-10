import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { BudgetService } from '../../../../core/services/budget.service';
import { ChartConfiguration } from 'chart.js';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-spending-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    BaseChartDirective
  ],
  template: `
    <div class="analytics-container">
      <div class="header">
        <h2>Phân tích chi tiêu</h2>
      </div>

      <!-- Chi tiết theo danh mục -->
      <mat-card class="category-details">
        <mat-card-header>
          <mat-card-title>Chi tiết theo danh mục</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @for (category of analytics?.categoryAnalytics; track category.categoryId) {
            <div class="category-item">
              <div class="category-header">
                <h3>{{ category.categoryName }}</h3>
                <span class="percentage" [class]="category.status">
                  {{ category.usagePercentage | number:'1.0-0' }}%
                </span>
              </div>
              
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress" 
                       [style.width.%]="category.usagePercentage"
                       [class]="category.status">
                  </div>
                </div>
              </div>

              <div class="amounts">
                <div class="budget-info">
                  <div class="spent">
                    <span class="label">Đã chi:</span>
                    <span class="value">{{ category.spent | number:'1.0-0' }}đ</span>
                  </div>
                  <div class="budget">
                    <span class="label">Ngân sách:</span>
                    <span class="value">{{ category.budget | number:'1.0-0' }}đ</span>
                  </div>
                </div>
                <div class="remaining">
                  <span class="label">Còn lại:</span>
                  <span class="value" [class]="category.status">
                    {{ (category.budget - category.spent) | number:'1.0-0' }}đ
                  </span>
                </div>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Biểu đồ xu hướng -->
      <div class="charts-container">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Xu hướng chi tiêu 6 tháng gần đây</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [datasets]="trendChartData.datasets"
              [labels]="trendChartData.labels"
              [options]="trendChartOptions"
              [type]="'line'">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Phân bổ chi tiêu theo danh mục</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [datasets]="categoryChartData.datasets"
              [labels]="categoryChartData.labels"
              [options]="categoryChartOptions"
              [type]="'doughnut'">
            </canvas>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;

      .header {
        margin-bottom: 2rem;
        h2 {
          font-size: 1.5rem;
          font-weight: 500;
          color: #333;
        }
      }

      .category-details {
        margin-bottom: 2rem;
        
        .category-item {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;

          &:last-child {
            border-bottom: none;
          }

          .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;

            h3 {
              margin: 0;
              font-size: 1.1rem;
              font-weight: 500;
              color: #333;
            }

            .percentage {
              font-weight: 500;
              padding: 0.25rem 0.75rem;
              border-radius: 1rem;
              font-size: 0.875rem;

              &.normal { 
                background: #e8f5e9;
                color: #2e7d32;
              }
              &.warning { 
                background: #fff3e0;
                color: #ef6c00;
              }
              &.exceeded { 
                background: #ffebee;
                color: #c62828;
              }
            }
          }

          .progress-container {
            margin: 1rem 0;

            .progress-bar {
              height: 8px;
              background: #eee;
              border-radius: 4px;
              overflow: hidden;

              .progress {
                height: 100%;
                transition: width 0.3s ease;

                &.normal { background: #4caf50; }
                &.warning { background: #ff9800; }
                &.exceeded { background: #f44336; }
              }
            }
          }

          .amounts {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 1rem;

            .budget-info {
              flex: 1;
              
              .spent, .budget {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;

                .label {
                  color: #666;
                }

                .value {
                  font-weight: 500;
                }
              }
            }

            .remaining {
              text-align: right;
              padding-left: 2rem;
              
              .label {
                display: block;
                color: #666;
                font-size: 0.8rem;
                margin-bottom: 0.25rem;
              }

              .value {
                font-weight: 500;
                font-size: 1.1rem;

                &.normal { color: #4caf50; }
                &.warning { color: #ff9800; }
                &.exceeded { color: #f44336; }
              }
            }
          }
        }
      }

      .charts-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
        gap: 1.5rem;

        .chart-card {
          min-height: 400px;

          mat-card-header {
            margin-bottom: 1rem;
          }

          mat-card-content {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
          }
        }

        @media (max-width: 960px) {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class SpendingAnalyticsComponent implements OnInit {
  analytics: any;
  
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  trendChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Chi tiêu',
        data: [],
        borderColor: '#f44336',
        tension: 0.1
      },
      {
        label: 'Ngân sách',
        data: [],
        borderColor: '#4caf50',
        tension: 0.1
      }
    ]
  };

  categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  categoryChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  @ViewChild('trendChart') trendChart?: BaseChartDirective;
  @ViewChild('categoryChart') categoryChart?: BaseChartDirective;

  constructor(
    private budgetService: BudgetService,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    this.loadAnalytics();
    this.subscribeToTransactionChanges();
  }

  private loadAnalytics() {
    this.budgetService.getSpendingAnalytics().subscribe(data => {
      this.analytics = data;
      this.updateCharts();
    });
  }

  private subscribeToTransactionChanges() {
    this.transactionService.getTransactions().subscribe(() => {
      this.loadAnalytics();
    });
  }

  private updateCharts() {
    this.trendChartData.labels = this.analytics.monthlyTrend.map((item: any) => item.month);
    this.trendChartData.datasets[0].data = this.analytics.monthlyTrend.map((item: any) => item.totalSpent);
    this.trendChartData.datasets[1].data = this.analytics.monthlyTrend.map((item: any) => item.budgetLimit);

    this.categoryChartData.labels = this.analytics.categoryAnalytics.map((cat: any) => cat.categoryName);
    this.categoryChartData.datasets[0].data = this.analytics.categoryAnalytics.map((cat: any) => cat.spent);

    if (this.trendChart) {
      this.trendChart.update();
    }
    if (this.categoryChart) {
      this.categoryChart.update();
    }
  }
} 