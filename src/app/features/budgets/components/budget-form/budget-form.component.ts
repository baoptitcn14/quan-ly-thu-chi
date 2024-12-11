import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  BudgetService,
  Budget,
} from '../../../../core/services/budget.service';
import { CategoryService } from '../../../../core/services/category.service';
import { NumberFormatter } from '../../../../shared/utils/number-formatter';
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule,
  ],
  template: `
    <div class="form-container">
      <h2>{{ isEditing ? 'Sửa ngân sách' : 'Thêm ngân sách mới' }}</h2>

      <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Danh mục</mat-label>
          <mat-select
            formControlName="categoryId"
            (selectionChange)="onCategoryChange($event)"
          >
            @for (category of categories; track category.id) {
            <mat-option [value]="category.id">
              {{ category.name }}
            </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Số tiền</mat-label>
          <input
            matInput
            type="text"
            formControlName="amount"
            (input)="formatNumber($event)"
            (blur)="formatNumber($event)"
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Chu kỳ</mat-label>
          <mat-select formControlName="period">
            <mat-option value="daily">Hàng ngày</mat-option>
            <mat-option value="weekly">Hàng tuần</mat-option>
            <mat-option value="monthly">Hàng tháng</mat-option>
            <mat-option value="yearly">Hàng năm</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Ngày bắt đầu</mat-label>
          <input
            matInput
            [matDatepicker]="startPicker"
            formControlName="startDate"
          />
          <mat-datepicker-toggle matSuffix [for]="startPicker">
          </mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Ngày kết thúc (tùy chọn)</mat-label>
          <input
            matInput
            [matDatepicker]="endPicker"
            formControlName="endDate"
          />
          <mat-datepicker-toggle matSuffix [for]="endPicker">
          </mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <div class="button-group">
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="budgetForm.invalid"
          >
            {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
          </button>
          <button mat-stroked-button type="button" routerLink="/budgets">
            Hủy
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        h2 {
          margin-bottom: 2rem;
          text-align: center;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;

          mat-form-field {
            width: 100%;
          }

          .button-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1rem;
          }
        }
      }
    `,
  ],
})
export class BudgetFormComponent implements OnInit, OnDestroy {
  budgetForm: FormGroup;
  categories: any[] = [];
  isEditing = false;
  budgetId: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.budgetForm = this.fb.group({
      categoryId: ['', Validators.required],
      categoryName: [''],
      amount: [0, [Validators.required, Validators.min(0)]],
      period: ['monthly', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null],
    });
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  ngOnInit() {
    const categorySub = this.categoryService
      .getCategories()
      .subscribe((categories) => {
        this.categories = categories;
      });
    this.subscriptions.add(categorySub);

    const paramSub = this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditing = true;
        this.budgetId = params['id'];
        this.loadBudget(params['id']);
      }
    });
    this.subscriptions.add(paramSub);
    
  }

  private async loadBudget(id: string) {
    this.budgetService.getBudgetById(id).subscribe((budget) => {
      if (budget) {
        this.budgetForm.patchValue({
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          amount: budget.amount.toLocaleString('vi-VN'),
          period: budget.period,
          startDate:
            budget.startDate instanceof Date
              ? budget.startDate
              : (budget.startDate as Timestamp).toDate(),
          endDate: budget.endDate
            ? budget.endDate instanceof Date
              ? budget.endDate.toLocaleDateString('vi-VN')
              : (budget.endDate as Timestamp).toDate()
            : null,
        });
      }
    });
  }

  onCategoryChange(event: any) {
    const selectedCategory = this.categories.find((c) => c.id === event.value);
    if (selectedCategory) {
      this.budgetForm.patchValue({
        categoryName: selectedCategory.name,
      });
    }
  }

  async onSubmit() {
    if (this.budgetForm.valid) {
      try {
        const formData = this.budgetForm.value;
        const budgetData = {
          ...formData,
          amount:
            parseFloat(formData.amount.toString().replace(/[^0-9]/g, '')) || 0,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : null,
        };

        if (this.isEditing && this.budgetId) {
          await this.budgetService.updateBudget(this.budgetId, budgetData);
        } else {
          await this.budgetService.addBudget(budgetData);
        }

        this.router.navigate(['/budgets']);
      } catch (error) {
        console.error('Lỗi khi lưu ngân sách:', error);
      }
    }
  }

  formatNumber(event: Event): void {
    NumberFormatter.formatCurrency(event);
    // this.budgetForm.patchValue({ amount: number });
  }
}
