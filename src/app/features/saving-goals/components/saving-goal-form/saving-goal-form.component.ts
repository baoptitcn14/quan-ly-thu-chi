import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SavingGoalService } from '../../../../core/services/saving-goal.service';
import { CategoryService } from '../../../../core/services/category.service';
import { NumberFormatter } from '../../../../shared/utils/number-formatter';

@Component({
  selector: 'app-saving-goal-form',
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
    RouterModule
  ],
  template: `
    <div class="form-container">
      <h2>{{ isEditing ? 'Sửa mục tiêu' : 'Thêm mục tiêu mới' }}</h2>

      <form [formGroup]="goalForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Tên mục tiêu</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Số tiền mục tiêu</mat-label>
          <input matInput formControlName="targetAmount" (input)="formatNumber($event)">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Danh mục</mat-label>
          <mat-select formControlName="category">
            @for (category of categories; track category.id) {
              <mat-option [value]="category.id">
                {{ category.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hạn hoàn thành</mat-label>
          <input matInput [matDatepicker]="deadlinePicker" formControlName="deadline">
          <mat-datepicker-toggle matSuffix [for]="deadlinePicker"></mat-datepicker-toggle>
          <mat-datepicker #deadlinePicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Mô tả (tùy chọn)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="button-group">
          <button mat-raised-button color="primary" type="submit" [disabled]="goalForm.invalid">
            {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
          </button>
          <button mat-stroked-button type="button" routerLink="/saving-goals">
            Hủy
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
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
        color: #333;
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
  `]
})
export class SavingGoalFormComponent implements OnInit {
  goalForm: FormGroup;
  categories: any[] = [];
  isEditing = false;
  goalId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private savingGoalService: SavingGoalService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.goalForm = this.fb.group({
      name: ['', Validators.required],
      targetAmount: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      deadline: [new Date(), Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.goalId = params['id'];
        this.loadGoal(params['id']);
      }
    });
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  private async loadGoal(id: string) {
    // Implement loading goal data
  }

  formatNumber(event: Event): void {
    NumberFormatter.formatCurrency(event);
  }

  async onSubmit() {
    if (this.goalForm.valid) {
      try {
        const formData = this.goalForm.value;
        const goalData = {
          ...formData,
          targetAmount: parseFloat(formData.targetAmount.toString().replace(/[^0-9]/g, '')) || 0,
          deadline: new Date(formData.deadline)
        };

        if (this.isEditing && this.goalId) {
          await this.savingGoalService.updateSavingGoal(this.goalId, goalData);
        } else {
          await this.savingGoalService.addSavingGoal(goalData);
        }

        this.router.navigate(['/saving-goals']);
      } catch (error) {
        console.error('Lỗi khi lưu mục tiêu:', error);
      }
    }
  }
} 