import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      main {
        padding-top: 80px; // Chiều cao của header (60px) + padding thêm (20px)
        padding-bottom: 2rem;
        padding-left: 1rem;
        padding-right: 1rem;
        max-width: 1200px;
        margin: 0 auto;

        @media (max-width: 768px) {
          padding-top: 70px; // Điều chỉnh cho mobile
        }
      }
    `,
  ],
})
export class AppComponent {
  title = 'quan-ly-chi-tieu';

  constructor(private authService: AuthService, private router: Router) {
    this.authService.isAuthenticated().subscribe(authenticated => {
      if (!authenticated) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
