import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TransactionService } from '../../../../core/services/transaction.service';

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
    MatSelectModule
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
              <input matInput type="number" formControlName="amount">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Danh mục</mat-label>
            <mat-select formControlName="category">
              <mat-option value="food">Ăn uống</mat-option>
              <mat-option value="transport">Di chuyển</mat-option>
              <mat-option value="bills">Hóa đơn</mat-option>
              <mat-option value="entertainment">Giải trí</mat-option>
              <mat-option value="other">Khác</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mô tả</mat-label>
            <input matInput formControlName="description">
          </mat-form-field>

          <div class="button-group">
            <button mat-raised-button color="primary" type="submit" [disabled]="transactionForm.invalid">
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
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 80px auto 2rem;
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);

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
  `]
})
export class TransactionFormComponent implements OnInit {
  transactionForm: FormGroup;
  isEditing = false;
  transactionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      description: ['', Validators.required],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.transactionId = params['id'];
        this.loadTransaction(params['id']);
      }
    });
  }

  private async loadTransaction(id: string) {
    try {
      const transaction = await this.transactionService.getTransaction(id).toPromise();
      if (transaction) {
        this.transactionForm.patchValue({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date
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
          ...this.transactionForm.value
        };

        if (this.isEditing && this.transactionId) {
          await this.transactionService.updateTransaction(this.transactionId, formData);
        } else {
          await this.transactionService.addTransaction(formData);
        }
        
        this.router.navigate(['/transactions']);
      } catch (error) {
        console.error('Lỗi khi lưu giao dịch:', error);
      }
    }
  }
} 