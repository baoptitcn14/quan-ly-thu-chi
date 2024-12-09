import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> {
    const cachedUser = this.authService['cookieService'].get(this.authService['CACHE_KEY']);
    if (cachedUser) {
      return new Observable<boolean>(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    this.router.navigate(['auth/login']);
    return new Observable<boolean>(observer => {
      observer.next(false); 
      observer.complete();
    });
  }
} 