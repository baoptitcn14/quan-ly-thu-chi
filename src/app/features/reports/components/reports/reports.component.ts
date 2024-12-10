import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../../core/services/transaction.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Workbook } from 'exceljs';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    BaseChartDirective
  ],
  template: `
    <div class="reports-container">
      <div class="header">
        <h2>Báo cáo chi tiêu</h2>
        <button mat-raised-button color="primary" (click)="exportReport()">
          <mat-icon>download</mat-icon>
          Xuất báo cáo
        </button>
      </div>
      
      <div class="chart-container">
        <canvas *ngIf="chartData.datasets[0].data.length > 0"
          baseChart
          [data]="chartData"
          [options]="chartOptions"          
          [type]="'pie'"
          >
        </canvas>
      </div>

      <div class="summary">
        <mat-card>
          <mat-card-header>
            <mat-icon color="primary">trending_up</mat-icon>
            <mat-card-title>Tổng thu tháng này</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="income">{{ monthlyIncome | number:'1.0-0' }}đ</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon color="warn">trending_down</mat-icon>
            <mat-card-title>Tổng chi tháng này</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="expense">{{ monthlyExpense | number:'1.0-0' }}đ</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 1rem;
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .chart-container {
        margin: 2rem 0;
        height: 400px;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }
      mat-card {
        mat-card-content {
          p {
            font-size: 1.5rem;
            font-weight: 500;
            margin: 1rem 0;
          }
          .income {
            color: #4caf50;
          }
          .expense {
            color: #f44336;
          }
        }
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  monthlyIncome = 0;
  monthlyExpense = 0;
  categories: any[] = [];

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384',
        '#36A2EB', 
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#4D5360'
      ]
    }]
  };

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories;
      this.loadTransactions();
    });
  }

  private loadTransactions() {
    this.transactionService.getTransactions().subscribe(transactions => {
      const now = new Date();
      const thisMonth = transactions.filter(t => {
        const transDate = t.date instanceof Date ? t.date : (t.date as any).toDate();
        return transDate.getMonth() === now.getMonth() &&
               transDate.getFullYear() === now.getFullYear();
      });

      this.monthlyIncome = thisMonth
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      this.monthlyExpense = thisMonth
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      this.updateChartData(thisMonth);
    });
  }

  private updateChartData(transactions: any[]) {
    const data = this.categories.map(category => 
      transactions
        .filter(t => t.type === 'expense' && t.category === category.id)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    this.chartData = {
      labels: this.categories.map(c => c.name),
      datasets: [{
        data: data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56', 
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#4D5360'
        ]
      }]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  exportReport() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo tài chính');

    worksheet.addRow(['BÁO CÁO TÀI CHÍNH THÁNG']);
    worksheet.addRow([`Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`]);
    worksheet.addRow([]);

    worksheet.addRow(['THỐNG KÊ THÁNG']);
    const incomeRow = worksheet.addRow(['Thu nhập', this.monthlyIncome]);
    incomeRow.getCell(2).font = { color: { argb: '00B050' } };

    const expenseRow = worksheet.addRow(['Chi tiêu', this.monthlyExpense]);
    expenseRow.getCell(2).font = { color: { argb: 'FF0000' } };

    const balanceRow = worksheet.addRow(['Số dư', this.monthlyIncome - this.monthlyExpense]);
    const balance = this.monthlyIncome - this.monthlyExpense;
    balanceRow.getCell(2).font = { color: { argb: balance >= 0 ? '00B050' : 'FF0000' } };

    worksheet.addRow([]);

    worksheet.addRow(['CHI TIÊU THEO LOẠI']);
    worksheet.addRow(['Loại', 'Số tiền']);
    this.chartData.labels!.forEach((label: unknown, index: number) => {
      const row = worksheet.addRow([
        label as string,
        this.chartData.datasets[0].data[index]
      ]);
      row.getCell(2).font = { color: { argb: 'FF0000' } };
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      link.href = url;
      link.download = `bao-cao-tai-chinh-${now.getMonth() + 1}-${now.getFullYear()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    });

    console.log('Đang xuất báo cáo Excel...');
  }
}