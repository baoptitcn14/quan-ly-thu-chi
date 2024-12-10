import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, doc, writeBatch, collectionData } from '@angular/fire/firestore';
import { Category } from './category.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly defaultCategories = [
    // Thu nhập
    { name: 'Lương', icon: 'work', type: 'income' as const, isDefault: true },
    { name: 'Thưởng', icon: 'card_giftcard', type: 'income' as const, isDefault: true },
    { name: 'Đầu tư', icon: 'trending_up', type: 'income' as const, isDefault: true },
    { name: 'Tiền lãi', icon: 'account_balance', type: 'income' as const, isDefault: true },
    
    // Chi tiêu
    { name: 'Ăn uống', icon: 'restaurant', type: 'expense' as const, isDefault: true },
    { name: 'Di chuyển', icon: 'directions_car', type: 'expense' as const, isDefault: true },
    { name: 'Hóa đơn & Tiện ích', icon: 'receipt', type: 'expense' as const, isDefault: true },
    { name: 'Mua sắm', icon: 'shopping_cart', type: 'expense' as const, isDefault: true },
    { name: 'Giải trí', icon: 'movie', type: 'expense' as const, isDefault: true },
    { name: 'Y tế & Sức khỏe', icon: 'medical_services', type: 'expense' as const, isDefault: true },
    { name: 'Giáo dục', icon: 'school', type: 'expense' as const, isDefault: true },
    { name: 'Nhà cửa', icon: 'home', type: 'expense' as const, isDefault: true },
    { name: 'Bảo hiểm', icon: 'security', type: 'expense' as const, isDefault: true },
    { name: 'Khác', icon: 'more_horiz', type: 'expense' as const, isDefault: true }
  ];

  constructor(private firestore: Firestore) {}

  async initializeUserData(userId: string) {
    // Kiểm tra xem người dùng đã có danh mục nào chưa
    const categoriesRef = collection(this.firestore, 'categories');
    const userCategoriesQuery = query(
      categoriesRef,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(userCategoriesQuery);
    
    // Nếu chưa có danh mục nào, thêm danh mục mặc định
    if (snapshot.empty) {
      const batch = writeBatch(this.firestore);
      
      for (const category of this.defaultCategories) {
        const newCategoryRef = doc(categoriesRef);
        batch.set(newCategoryRef, {
          ...category,
          id: newCategoryRef.id,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await batch.commit();
    }
  }

  getDefaultCategories() {
    return this.defaultCategories;
  }

  async addCustomCategory(userId: string, category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const categoriesRef = collection(this.firestore, 'categories');
    return await addDoc(categoriesRef, {
      ...category,
      userId,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  searchUsers(query: string): Observable<User[]> {
    if (!query?.trim()) return of([]);
    
    const usersRef = collection(this.firestore, 'users');
    const searchQuery = query.toLowerCase().trim();
    
    return collectionData(usersRef, { idField: 'uid' }).pipe(
      map((users: any) => users.filter((user: any) => 
        user.email?.toLowerCase().includes(searchQuery) || 
        user.displayName?.toLowerCase().includes(searchQuery)
      ).slice(0, 5))
    );
  }
} 