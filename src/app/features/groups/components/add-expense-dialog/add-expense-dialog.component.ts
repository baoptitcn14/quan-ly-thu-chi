import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Group, GroupExpense } from '../../../../core/models/group.model';
import { NumberFormatter } from '../../../../shared/utils/number-formatter';
import { CategorySelectComponent } from '../../../../shared/components/category-select/category-select.component';

@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    CategorySelectComponent
  ],
  template: `
    <h2 mat-dialog-title>Thêm chi tiêu nhóm</h2>
    <mat-dialog-content>
      <form [formGroup]="expenseForm">
        <mat-form-field appearance="outline">
          <mat-label>Mô tả</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Số tiền</mat-label>
          <input matInput formControlName="amount" (input)="formatNumber($event)">
        </mat-form-field>

        <app-category-select 
          formControlName="category"
          label="Chọn danh mục chi tiêu">
        </app-category-select>

        <div class="split-section">
          <h3>Chia cho:</h3>
          <div class="members-list">
            @for (member of data.group.members; track member.userId) {
              <div class="member-item">
                <mat-checkbox [formControlName]="member.userId">
                  {{member.displayName}}
                </mat-checkbox>
                @if (expenseForm.get(member.userId)?.value) {
                  <mat-form-field>
                    <mat-label>Số tiền</mat-label>
                    <input matInput [formControlName]="member.userId + '_amount'"
                           (input)="formatNumber($event)">
                  </mat-form-field>
                }
              </div>
            }
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" 
              [disabled]="!expenseForm.valid"
              (click)="onSubmit()">
        Thêm
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }

    mat-dialog-content {
      padding: 1rem !important;
    }

    .split-section {
      h3 {
        margin: 1rem 0;
        color: #666;
      }

      .members-list {
        display: grid;
        gap: 1rem;

        .member-item {
          display: flex;
          align-items: center;
          gap: 1rem;

          mat-form-field {
            margin: 0;
            width: 150px;
          }
        }
      }
    }
  `]
})
export class AddExpenseDialogComponent implements OnInit {
  isEditing = false;
  expenseForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      group: Group,
      expense?: GroupExpense // Optional expense for editing
    },
    private fb: FormBuilder
  ) {
    this.isEditing = !!data.expense;
    this.initForm();
  }

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const expense = this.data.expense;
    this.expenseForm = this.fb.group({
      description: [expense?.description || '', Validators.required],
      amount: [expense?.amount || '', [Validators.required, Validators.min(0)]],
      category: [expense?.category || '', Validators.required]
    });

    // Initialize split amounts if editing
    this.data.group.members.forEach(member => {
      const split = expense?.splitBetween.find(s => s.userId === member.userId);
      this.expenseForm.addControl(member.userId, 
        this.fb.control(!!split));
      this.expenseForm.addControl(member.userId + '_amount',
        this.fb.control(split?.amount || ''));
    });
  }

  formatNumber(event: Event): void {
    NumberFormatter.formatCurrency(event);
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      const formData = this.expenseForm.value;
      const totalAmount = parseFloat(formData.amount.toString().replace(/[^0-9]/g, ''));
      
      const splitBetween = this.data.group.members
        .filter(member => formData[member.userId])
        .map(member => {
          const existingSplit = this.data.expense?.splitBetween
            .find(s => s.userId === member.userId);
          
          return {
            userId: member.userId,
            displayName: member.displayName,
            amount: parseFloat(formData[member.userId + '_amount']
              .toString().replace(/[^0-9]/g, '')) || 0,
            status: existingSplit?.status || 'pending'
          };
        });

      this.dialogRef.close({
        description: formData.description,
        amount: totalAmount,
        category: formData.category,
        groupId: this.data.group.id,
        splitBetween,
        // Preserve original fields when editing
        ...(this.isEditing && {
          paidBy: this.data.expense!.paidBy
        })
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 