import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Group } from '../../../../core/models/group.model';
import { UserDataService } from '../../../../core/services/user-data.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../../../../core/models/user.interface';

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  template: `
    <h2 mat-dialog-title>Thêm thành viên</h2>
    <mat-dialog-content>
      <form [formGroup]="memberForm">
        <mat-form-field appearance="outline">
          <mat-label>Tìm kiếm thành viên</mat-label>
          <input matInput
                 type="text"
                 formControlName="search"
                 [matAutocomplete]="auto"
                 placeholder="Nhập email hoặc tên">
          <mat-error *ngIf="memberForm.get('search')?.hasError('required')">
            Vui lòng chọn thành viên
          </mat-error>
        </mat-form-field>

        <mat-autocomplete #auto="matAutocomplete" 
                         (optionSelected)="onUserSelected($event)"
                         [displayWith]="displayFn">
          @for (user of filteredUsers$ | async; track user.uid) {
            <mat-option [value]="user" 
                       [disabled]="isUserInGroup(user)">
              <div class="user-option">
                <img [src]="user.photoURL || 'assets/default-avatar.svg'" 
                     [alt]="user.displayName"
                     class="user-avatar">
                <div class="user-info">
                  <div class="name">{{user.displayName}}</div>
                  <div class="email">{{user.email}}</div>
                </div>
              </div>
            </mat-option>
          }
        </mat-autocomplete>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button 
              color="primary"
              [disabled]="!selectedUser"
              (click)="onSubmit()">
        Thêm
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
    }
    mat-dialog-content {
      padding: 24px !important;
      min-height: 200px;
    }
    .user-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-info {
        .name {
          font-weight: 500;
          color: #1e293b;
        }
        .email {
          font-size: 0.875rem;
          color: #64748b;
        }
      }
    }
  `]
})
export class AddMemberDialogComponent implements OnInit {
  memberForm: FormGroup;
  filteredUsers$!: Observable<User[]>;
  selectedUser: User | null = null;

  constructor(
    private dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group },
    private fb: FormBuilder,
    private userDataService: UserDataService
  ) {
    this.memberForm = this.fb.group({
      search: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.filteredUsers$ = this.memberForm.get('search')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string') {
          return this.userDataService.searchUsers(value);
        }
        return [];
      })
    );
  }

  displayFn(user: User): string {
    return user ? user.displayName || user.email : '';
  }

  isUserInGroup(user: User): boolean {
    return this.data.group.members.some(member => member.userId === user.uid);
  }

  onUserSelected(event: any) {
    this.selectedUser = event.option.value;
  }

  onSubmit(): void {
    if (this.selectedUser) {
      this.dialogRef.close(this.selectedUser.email);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 