import { Injectable, OnDestroy } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  collectionData, 
  getDoc 
} from '@angular/fire/firestore';
import { Observable, of, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { UserDataService } from './user-data.service';

export interface Category {
  id?: string;
  userId: string;
  name: string;
  icon?: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService implements OnDestroy {
  private readonly collectionName = 'categories';
  private categories: Category[] = [];
  private subscriptions = new Subscription();

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userDataService: UserDataService
  ) {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const subscription = this.getCategories().subscribe(categories => {
      this.categories = categories;
    });
    this.subscriptions.add(subscription);
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  getCategories(): Observable<Category[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of([]);
    
    const categoriesRef = collection(this.firestore, this.collectionName);
    const categoriesQuery = query(
      categoriesRef,
      where('userId', '==', userId)
    );
    
    return collectionData(categoriesQuery, { idField: 'id' }) as Observable<Category[]>;
  }

  async addCategory(category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');
    
    await this.userDataService.addCustomCategory(userId, category);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, categoryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Danh mục không tồn tại');
    }

    const category = docSnap.data() as Category;
    if (category.isDefault) {
      throw new Error('Không thể xóa danh mục mặc định');
    }

    await deleteDoc(docRef);
  }

  getCategory(categoryId: string): Category | undefined {
    return this.categories.find(cat => cat.id === categoryId);
  }
} 