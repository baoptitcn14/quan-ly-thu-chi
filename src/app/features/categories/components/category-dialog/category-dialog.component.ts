import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Thêm danh mục mới</h2>
    <mat-dialog-content style="padding: 20px;">
      <form [formGroup]="categoryForm">
        <mat-form-field appearance="outline">
          <mat-label>Tên danh mục</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Icon</mat-label>
          <mat-select formControlName="icon">
            <mat-option *ngFor="let icon of availableIcons" [value]="icon">
              <mat-icon>{{icon}}</mat-icon>
              {{icon}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Loại</mat-label>
          <mat-select formControlName="type">
            <mat-option value="income">Thu nhập</mat-option>
            <mat-option value="expense">Chi tiêu</mat-option>
            <mat-option value="both">Cả hai</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" 
              [disabled]="!categoryForm.valid"
              (click)="onSubmit()">
        Thêm
      </button>
    </mat-dialog-actions>
  `
})
export class CategoryDialogComponent {
  categoryForm: FormGroup;
  availableIcons = [
    'restaurant', 'directions_car', 'receipt', 'movie',
    'shopping_cart', 'home', 'school', 'medical_services',
    'attach_money', 'account_balance', 'work', 'card_giftcard'
  ];

  constructor(
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      icon: ['attach_money'],
      type: ['expense', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.dialogRef.close(this.categoryForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 