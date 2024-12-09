import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    RouterModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="register-card">
        <mat-card-header>
          <div class="logo-container">
            <img src="assets/logo.svg" alt="Logo" class="logo">
          </div>
          <mat-card-title>Đăng ký tài khoản</mat-card-title>
          <mat-card-subtitle>Quản lý chi tiêu thông minh</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email là bắt buộc
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Email không hợp lệ
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Mật khẩu</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Mật khẩu là bắt buộc
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Mật khẩu phải có ít nhất 6 ký tự
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="registerForm.invalid">
              <mat-icon>person_add</mat-icon>
              Đăng ký
            </button>

            <div class="auth-links">
              <a mat-button routerLink="/auth/login" color="primary">
                <mat-icon>arrow_back</mat-icon>
                Đã có tài khoản? Đăng nhập
              </a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 1rem;
    }

    .register-card {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border-radius: 16px;

      mat-card-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 2rem;

        .logo-container {
          width: 80px;
          height: 80px;
          margin-bottom: 1rem;
          
          .logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        mat-card-title {
          font-size: 1.5rem;
          margin: 1rem 0 0.5rem;
          color: #333;
        }

        mat-card-subtitle {
          color: #666;
        }
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        mat-form-field {
          width: 100%;
        }

        .mat-mdc-form-field {
          margin-bottom: 0.5rem;
        }

        button[type="submit"] {
          margin: 1rem 0;
          padding: 0.75rem;
          font-size: 1rem;
          border-radius: 8px;

          mat-icon {
            margin-right: 0.5rem;
          }
        }

        .auth-links {
          display: flex;
          justify-content: center;
          margin-top: 1rem;

          a {
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;

            mat-icon {
              font-size: 1rem;
              width: 1rem;
              height: 1rem;
            }
          }
        }
      }
    }

    @media (max-width: 480px) {
      .register-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        const { email, password } = this.registerForm.value;
        await this.authService.register(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        console.error('Lỗi đăng ký:', error.message);
      }
    }
  }
} 