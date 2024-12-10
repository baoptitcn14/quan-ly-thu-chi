import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  collectionData,
  updateDoc,
  getDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface SavingGoal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  description?: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  progress?: number; // Phần trăm hoàn thành
  remainingAmount?: number; // Số tiền còn thiếu
  remainingDays?: number; // Số ngày còn lại
  monthlyRequired?: number; // Số tiền cần tiết kiệm mỗi tháng
}

@Injectable({
  providedIn: 'root'
})
export class SavingGoalService {
  private readonly collectionName = 'saving_goals';

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  getSavingGoals(): Observable<SavingGoal[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of([]);

    const goalsRef = collection(this.firestore, this.collectionName);
    const goalsQuery = query(
      goalsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return collectionData(goalsQuery, { idField: 'id' }).pipe(
      map((goals: any[]) => this.calculateGoalMetrics(goals))
    );
  }

  private calculateGoalMetrics(goals: SavingGoal[]): SavingGoal[] {
    return goals.map(goal => {
      const deadline = goal.deadline instanceof Date ? 
        goal.deadline : 
        (goal.deadline as Timestamp).toDate();
        
      const today = new Date();
      const remainingDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const monthlyRequired = remainingAmount / (remainingDays / 30);

      return {
        ...goal,
        progress,
        remainingAmount,
        remainingDays,
        monthlyRequired,
        status: this.calculateStatus(goal, remainingDays)
      };
    });
  }

  private calculateStatus(goal: SavingGoal, remainingDays: number): 'active' | 'completed' | 'failed' {
    if (goal.currentAmount >= goal.targetAmount) return 'completed';
    if (remainingDays < 0) return 'failed';
    return 'active';
  }

  async addSavingGoal(goal: Omit<SavingGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');

    const goalsRef = collection(this.firestore, this.collectionName);
    await addDoc(goalsRef, {
      ...goal,
      userId,
      status: 'active',
      currentAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async updateSavingGoal(id: string, goal: Partial<SavingGoal>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const updateData = {
      ...goal,
      updatedAt: new Date()
    };
    await updateDoc(docRef, updateData);
  }

  async deleteSavingGoal(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async addContribution(goalId: string, amount: number): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, goalId);
    const goal = (await getDoc(docRef)).data() as SavingGoal;
    
    await updateDoc(docRef, {
      currentAmount: goal.currentAmount + amount,
      updatedAt: new Date()
    });
  }
} 