import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.interface';
import { Observable } from 'rxjs';
import { ProfileDialogComponent } from './profile-dialog.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  template: `
    <div class="app-container">
      @if (currentUser$ | async) {
        <div class="sidebar-overlay" (click)="toggleMenu()"></div>
         <!-- Sidebar -->
      <aside class="sidebar" [class.expanded]="isMenuOpen">
        <div class="sidebar-header">
          <div class="logo">
            <img src="assets/logo.svg" alt="Logo" />
          </div>
        </div>

        <nav class="sidebar-nav">
          <ul class="nav-links">
            <!-- Trang chủ -->
            <li>
              <a
                routerLink="/dashboard"
                routerLinkActive="active"
                class="nav-link"
                (click)="closeMenuOnMobile()"
              >
                <mat-icon>home</mat-icon>
                <span>Trang chủ</span>
              </a>
            </li>

            <!-- Quản lý thu chi -->
            <li class="nav-group">
              <div class="nav-group-header">Quản lý thu chi</div>
              <div class="nav-group-items">
                <a
                  routerLink="/transactions"
                  routerLinkActive="active"
                  class="nav-link"
                  (click)="closeMenuOnMobile()"
                >
                  <mat-icon>receipt</mat-icon>
                  <span>Giao dịch</span>
                </a>
                <a
                  routerLink="/budgets"
                  routerLinkActive="active"
                  class="nav-link"
                  (click)="closeMenuOnMobile()"
                >
                  <mat-icon>savings</mat-icon>
                  <span>Ngân sách</span>
                </a>
                <a
                  routerLink="/saving-goals"
                  routerLinkActive="active"
                  class="nav-link"
                  (click)="closeMenuOnMobile()"
                >
                  <mat-icon>monetization_on</mat-icon>
                  <span>Mục tiêu tiết kiệm</span>
                </a>
              </div>
            </li>

            <!-- Báo cáo & Phân tích -->
            <li class="nav-group">
              <div class="nav-group-header">Báo cáo & Phân tích</div>
              <div class="nav-group-items">
                <a
                  routerLink="/analytics"
                  routerLinkActive="active"
                  class="nav-link"
                  (click)="closeMenuOnMobile()"
                >
                  <mat-icon>analytics</mat-icon>
                  <span>Phân tích chi tiêu</span>
                </a>
                <a
                  routerLink="/reports"
                  routerLinkActive="active"
                  class="nav-link"
                  (click)="closeMenuOnMobile()"
                >
                  <mat-icon>assessment</mat-icon>
                  <span>Báo cáo tài chính</span>
                </a>
              </div>
            </li>

            <!-- Nhóm chi tiêu -->
            <li>
              <a
                routerLink="/groups"
                routerLinkActive="active"
                class="nav-link"
                (click)="closeMenuOnMobile()"
              >
                <mat-icon>groups</mat-icon>
                <span>Nhóm chi tiêu</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      }
     

      <!-- Main Content Area -->
      <div class="main-area" [class.w100]="!(currentUser$ | async)">
        @if (currentUser$ | async) {
        <!-- Header -->
        <header class="header">
          <button class="menu-toggle" mat-icon-button (click)="toggleMenu()">
            <mat-icon>menu</mat-icon>
          </button>

          <div class="user-menu">
            <app-notification-bell></app-notification-bell>
            <button
              mat-button
              [matMenuTriggerFor]="userMenu"
              class="profile-button"
            >
              <img
                [src]="
                  (currentUser$ | async)?.photoURL ||
                  'assets/default-avatar.svg'
                "
                alt="Avatar"
                class="avatar"
              />
              <mat-icon>arrow_drop_down</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="openProfileDialog()">
                <mat-icon>account_circle</mat-icon>
                <span>Thông tin cá nhân</span>
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Đăng xuất</span>
              </button>
            </mat-menu>
          </div>
        </header>
        }
        <!-- Main Content -->
        <main class="main-content">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        min-height: 100vh;
        background: #f8fafc;
      }

      .sidebar {
        width: 280px;
        background: #f8fafc;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        z-index: 1000;
        height: 100vh;
        position: fixed;
        left: 0;
        transition: all 0.3s ease;

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #e2e8f0;

          .logo {
            height: 40px;
            img {
              height: 100%;
              width: auto;
            }
          }
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;

          .nav-links {
            list-style: none;
            padding: 0;
            margin: 0;

            .nav-group {
              margin: 1.5rem 0;

              .nav-group-header {
                padding: 0 1.5rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                margin-bottom: 0.5rem;
              }

              .nav-group-items {
                padding: 0.25rem 0;
              }
            }

            .nav-link {
              display: flex;
              align-items: center;
              padding: 0.75rem 1.5rem;
              color: #475569;
              text-decoration: none;
              transition: all 0.2s ease;
              gap: 0.75rem;
              margin: 0.125rem 0.75rem;
              border-radius: 8px;

              mat-icon {
                width: 20px;
                height: 20px;
                font-size: 20px;
              }

              span {
                font-size: 0.875rem;
                font-weight: 500;
              }

              &:hover {
                background: #f1f5f9;
                color: #3b82f6;
              }

              &.active {
                background: #e0f2fe;
                color: #0284c7;
                font-weight: 600;
              }
            }
          }
        }
      }

      .header {
        height: 64px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem;
        position: sticky;
        top: 0;
        z-index: 900;

        .menu-toggle {
          display: none;
        }

        .user-menu {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 16px;

          .profile-button {
            min-height: 40px;
            padding: 4px 8px;
            border-radius: 40px;
            background: transparent;
            border: none;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;

            &:hover {
              background: #f1f5f9;
            }

            .avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              object-fit: cover;
            }

            mat-icon {
              color: #64748b;
              width: 20px;
              height: 20px;
              font-size: 20px;
            }
          }

          app-notification-bell {
            margin-right: 8px;
          }
        }
      }

      .main-area {
        margin-left: 280px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        transition: margin-left 0.3s ease;
        padding: 1.5rem;

        &.w100 {
          margin-left: 0;
        }
      }

      ::ng-deep .mat-menu-panel {
        margin-top: 8px;
        border-radius: 12px !important;
        overflow: hidden;
        min-width: 200px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;

        .mat-menu-content {
          padding: 8px !important;
        }

        .mat-menu-item {
          border-radius: 8px;
          margin: 4px 0;
          height: 44px;
          line-height: 44px;
          gap: 12px;
          color: #334155;
          font-weight: 500;
          transition: all 0.2s ease;

          mat-icon {
            color: #64748b;
            margin-right: 0;
          }

          &:hover {
            background: #f1f5f9;
            color: #2563eb;

            mat-icon {
              color: #2563eb;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .user-menu {
          gap: 8px;
          
          .profile-button {
            padding: 4px;
            
            mat-icon {
              display: none;
            }
          }
        }
      }

      @media (max-width: 1024px) {
        .sidebar {
          left: -280px;
          background: #fff;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);

          &.expanded {
            left: 0;
          }
        }

        .main-area {
          margin-left: 0;
          padding: 1rem;
        }

        .header {
          .menu-toggle {
            display: block;
            margin-right: 1rem;
          }

          .user-menu {
            .profile-button {
              .username {
                display: none;
              }
            }
          }
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    NotificationBellComponent,
  ],
})
export class HeaderComponent {
  isMenuOpen = false;
  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.currentUser$ = this.authService.getCurrentUser();

    // Tự động đóng menu khi chuyển route
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isMenuOpen = false;
      }
    });
  }

  toggleMenu(event?: Event) {
    if (event) {
      event.stopPropagation(); // Ngăn sự kiện nổi bọt
    }
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenuOnMobile() {
    if (window.innerWidth <= 1024) {
      this.isMenuOpen = false;
    }
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isMenuButton = target.closest('.menu-toggle');
    const isSidebar = target.closest('.sidebar');

    if (
      !isMenuButton &&
      !isSidebar &&
      this.isMenuOpen &&
      window.innerWidth <= 1024
    ) {
      this.isMenuOpen = false;
    }
  }

  openProfileDialog(): void {
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '400px',
      data: this.authService.getCurrentUserValue(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Cập nhật thông tin người dùng
        this.authService.updateProfile(result);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
