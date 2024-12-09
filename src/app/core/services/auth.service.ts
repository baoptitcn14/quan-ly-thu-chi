import { Inject, Injectable } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, map, switchMap, tap } from 'rxjs';
import { User } from '../models/user.interface';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly CACHE_KEY = 'currentUser';
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getCachedUser()
  );
  user$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private cookieService: CookieService,
    private router: Router
  ) {
    // Theo dõi trạng thái đăng nhập
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await this.getUserData(firebaseUser.uid);
          this.setCurrentUser(userData);
        } catch (error) {
          console.error('Lỗi khi lấy thông tin người dùng:', error);
          this.setCurrentUser(null);
        }
      } else {
        this.setCurrentUser(null);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const userData = await this.updateUserData(credential.user);
      this.setCurrentUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async googleLogin(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      const userData = await this.updateUserData(credential.user);
      this.setCurrentUser(userData);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.setCurrentUser(null);

      this.router.navigate(['auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  private async getUserData(uid: string): Promise<User> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      return userSnapshot.data() as User;
    } else {
      throw new Error('User not found in Firestore');
    }
  }

  private async updateUserData(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);

    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    await setDoc(userRef, userData, { merge: true });
    return userData;
  }

  private getCachedUser(): User | null {
    const cachedUser = this.cookieService.get(this.CACHE_KEY);
    return cachedUser ? JSON.parse(cachedUser) : null;
  }

  private setCurrentUser(user: User | null): void {
    if (user) {
      this.cookieService.set(this.CACHE_KEY, JSON.stringify(user), {
        expires: 7, // Cookie hết hạn sau 7 ngày
        secure: true, // Chỉ gửi qua HTTPS
        sameSite: 'Strict', // Bảo mật CSRF
      });
    } else {
      this.cookieService.delete(this.CACHE_KEY);
    }
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map((user) => !!user));
  }

  getCurrentUser(): Observable<User | null> {
    return this.user$;
  }

  getCurrentUserId(): string | null {
    return this.currentUserSubject.getValue()?.uid || null;
  }

  async updateProfile(profileData: Partial<User>): Promise<void> {
    const userId = this.currentUserSubject.getValue()?.uid;
    if (!userId) throw new Error('No user logged in');

    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date()
    });

    // Cập nhật local state
    const currentUser = this.currentUserSubject.getValue();
    if (currentUser) {
      this.setCurrentUser({
        ...currentUser,
        ...profileData
      });
    }
  }

  public getCurrentUserValue(): User | null {
    return this.currentUserSubject.getValue();
  }
}
