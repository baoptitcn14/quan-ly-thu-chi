import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../../core/services/transaction.service';
import {
  CategoryService,
  Category,
} from '../../../../core/services/category.service';
import { MatDialog } from '@angular/material/dialog';
import { CategoryDialogComponent } from '../../../../features/categories/components/category-dialog/category-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NumberFormatter } from '../../../../shared/utils/number-formatter';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="container">
      <div class="form-container">
        <h2>{{ isEditing ? 'Sửa giao dịch' : 'Thêm giao dịch mới' }}</h2>

        <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Loại giao dịch</mat-label>
              <mat-select formControlName="type">
                <mat-option value="income">Thu nhập</mat-option>
                <mat-option value="expense">Chi tiêu</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Số tiền</mat-label>
              <input matInput type="text" formControlName="amount" (input)="formatNumber($event)" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Danh mục</mat-label>
            <mat-select formControlName="category">
              @for (category of categories; track category.id) {
                @if (transactionForm.get('type')?.value === category.type || 
                     category.type === 'both') {
                  <mat-option [value]="category.id">
                    <div class="category-option">
                      <span class="category-info">
                        {{category.name}}
                      </span>
                      @if (!category.isDefault && category.id) {
                        <button mat-icon-button color="warn" 
                                class="delete-button"
                                (click)="deleteCategory($event, category.id)"
                                matTooltip="Xóa danh mục">
                          <mat-icon class="delete-icon">delete</mat-icon>
                        </button>
                      }
                    </div>
                  </mat-option>
                }
              }
            </mat-select>
            <button matSuffix mat-icon-button (click)="openCategoryDialog($event)">
              <mat-icon>add</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mô tả</mat-label>
            <input matInput formControlName="description" />
          </mat-form-field>

          <div class="button-group">
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="transactionForm.invalid"
            >
              {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
            </button>
            <button mat-stroked-button type="button" routerLink="/transactions">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 600px;
        margin: 80px auto 2rem;
        padding: 2rem;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        @media (max-width: 576px) {
          padding: 1rem;
          margin: 60px 1rem 1rem;
        }

        h2 {
          margin-bottom: 2rem;
          text-align: center;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;

          @media (max-width: 576px) {
            grid-template-columns: 1fr;
          }
        }

        mat-form-field {
          width: 100%;
          margin-bottom: 1rem;
        }

        .button-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 2rem;

          @media (max-width: 576px) {
            grid-template-columns: 1fr;
          }

          button {
            width: 100%;
          }
        }
      }

      .category-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 36px;
      }

      .category-info {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          margin-right: 4px;
        }
      }

      .delete-button {
        min-width: 32px;
        width: 32px;
        height: 32px;
        padding: 0;
        margin-right: -8px;
        
        .delete-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          line-height: 18px;
          margin: 0;
        }

        &:hover {
          background-color: rgba(244, 67, 54, 0.1);
        }
      }

      :host ::ng-deep {
        .mat-mdc-option {
          min-height: 36px;
          padding: 0 16px;
        }
        
        .mat-mdc-option .mdc-list-item__primary-text {
          width: 100%;
        }
      }
    `,
  ],
})
export class TransactionFormComponent implements OnInit {
  transactionForm: FormGroup;
  isEditing = false;
  transactionId: string | null = null;
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private dialog: MatDialog
  ) {
    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      description: ['', Validators.required],
      date: [new Date(), Validators.required],
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditing = true;
        this.transactionId = params['id'];
        this.loadTransaction(params['id']);
      }
    });

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  private async loadTransaction(id: string) {
    try {
      const transaction = await this.transactionService
        .getTransaction(id)
        .toPromise();
      if (transaction) {
        this.transactionForm.patchValue({
          type: transaction.type,
          amount: transaction.amount.toLocaleString('vi-VN'),
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải giao dịch:', error);
      this.router.navigate(['/transactions']);
    }
  }

  async onSubmit() {
    if (this.transactionForm.valid) {
      try {
        const formData = {
          ...this.transactionForm.value,
        };
        
        const selectedCategory = this.categories.find(
          cat => cat.id === formData.category
        );
        
        const transactionData = {
          ...formData,
          categoryName: selectedCategory ? selectedCategory.name : '',
          amount: parseFloat(formData.amount.replace(/[^0-9]/g, '')) || 0
        };

        if (this.isEditing && this.transactionId) {
          await this.transactionService.updateTransaction(
            this.transactionId,
            transactionData
          );
        } else {
          await this.transactionService.addTransaction(transactionData);
        }

        this.router.navigate(['/transactions']);
      } catch (error) {
        console.error('Lỗi khi lưu giao dịch:', error);
      }
    }
  }

  openCategoryDialog(event: Event): void {
    event.stopPropagation(); // Ngăn sự kiện nổi bọt lên select

    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.categoryService.addCategory(result);
      }
    });
  }

  formatNumber(event: Event): void {
    NumberFormatter.formatCurrency(event);
  }
  
  async deleteCategory(event: Event, categoryId: string) {
    event.stopPropagation(); // Ngăn đóng select khi click
    
    try {
      const result = await this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Xóa danh mục',
          message: 'Bạn có chắc chắn muốn xóa danh mục này?'
        }
      }).afterClosed().toPromise();

      if (result) {
        await this.categoryService.deleteCategory(categoryId);
      }
    } catch (error: any) {
      console.error('Lỗi khi xóa danh mục:', error);
      // Hiển thị thông báo lỗi cho người dùng
    }
  }

}

