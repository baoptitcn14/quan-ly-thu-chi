import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  collectionData,
  getDoc,
  docData,
} from '@angular/fire/firestore';
import { Observable, of, from, firstValueFrom, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Group, GroupExpense, GroupMember, SplitDetail } from '../models/group.model';
import { AuthService } from './auth.service';

interface UserDoc {
  id: string;
  displayName?: string;
  photoURL?: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private readonly groupsCollection = 'groups';
  private readonly expensesCollection = 'group-expenses';

  constructor(private firestore: Firestore, private authService: AuthService) {}

  // Tạo nhóm mới
  async createGroup(groupData: Partial<Group>): Promise<string | undefined> {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Lấy thông tin user hiện tại
      const currentUser = await firstValueFrom(
        this.authService.getCurrentUser().pipe(
          map((user) => ({
            displayName: user?.displayName || 'Anonymous',
            photoURL: user?.photoURL,
          }))
        )
      );

      const newGroup = {
        ...groupData,
        createdBy: userId,
        memberIds: [userId],
        members: [
          {
            userId,
            displayName: currentUser?.displayName || 'Anonymous',
            photoURL: currentUser?.photoURL,
            role: 'admin' as const,
            joinedAt: new Date(),
          },
        ],
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(
        collection(this.firestore, this.groupsCollection),
        newGroup
      );
      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  // Lấy danh sách nhóm của user
  getUserGroups(): Observable<Group[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of([]);

    const groupsRef = collection(this.firestore, this.groupsCollection);
    const memberQuery = query(
      groupsRef,
      where('memberIds', 'array-contains', userId)
    );

    return collectionData(memberQuery, { idField: 'id' }).pipe(
      map((groups: any) => {
        return groups.map((group: any) => ({
          ...group,
          members: group.members || [],
        })) as Group[];
      })
    );
  }

  // Lấy thông tin chi tiết nhóm
  getGroup(groupId: string): Observable<Group | null> {
    const docRef = doc(this.firestore, this.groupsCollection, groupId);
    return docData(docRef, { idField: 'id' }).pipe(
      map(data => {
        if (!data) return null;
        return data as Group;
      })
    );
  }

  // Cập nhật thông tin nhóm
  async updateGroup(groupId: string, data: Partial<Group>): Promise<void> {
    try {
      const groupRef = doc(this.firestore, this.groupsCollection, groupId);
      await updateDoc(groupRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  // Thêm thành viên vào nhóm
  async addMember(groupId: string, email: string): Promise<void> {
    try {
      // Tìm user theo email
      const userQuery = query(
        collection(this.firestore, 'users'),
        where('email', '==', email)
      );

      const userDocs = await firstValueFrom(
        collectionData(userQuery, { idField: 'id' }).pipe(
          map((users: UserDoc[]) => users[0])
        )
      ) as UserDoc;

      if (!userDocs) throw new Error('User not found');

      const newMember: GroupMember = {
        userId: userDocs.id,
        displayName: userDocs.displayName || email,
        photoURL: userDocs.photoURL,
        role: 'member',
        joinedAt: new Date(),
      };

      const groupRef = doc(this.firestore, this.groupsCollection, groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data() as Group;

      await updateDoc(groupRef, {
        memberIds: [...group.memberIds, newMember.userId],
        members: [...group.members, newMember],
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  // Lấy danh sách thành viên
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const groupDoc = await getDoc(
      doc(this.firestore, this.groupsCollection, groupId)
    );
    const group = groupDoc.data() as Group;
    return group.members;
  }

  // Thêm chi tiêu nhóm
  async addGroupExpense(expense: Partial<GroupExpense>): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const newExpense = {
      ...expense,
      paidBy: userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(
      collection(this.firestore, this.expensesCollection),
      newExpense
    );
  }

  // Lấy chi tiêu của nhóm
  getGroupExpenses(groupId: string): Observable<GroupExpense[]> {
    const expensesRef = collection(this.firestore, this.expensesCollection);
    const q = query(expensesRef, where('groupId', '==', groupId));
    return collectionData(q, { idField: 'id' }) as Observable<GroupExpense[]>;
  }

  // Tính toán số dư và nợ trong nhóm
  calculateBalances(groupId: string): Observable<{ [key: string]: number }> {
    return this.getGroupExpenses(groupId).pipe(
      map((expenses) => {
        const balances: { [key: string]: number } = {};

        expenses.forEach((expense) => {
          // Cộng tiền cho người trả
          balances[expense.paidBy] =
            (balances[expense.paidBy] || 0) + expense.amount;

          // Trừ tiền những người được chia
          expense.splitBetween.forEach((split) => {
            balances[split.userId] =
              (balances[split.userId] || 0) - split.amount;
          });
        });

        return balances;
      })
    );
  }

  // Thanh toán chi tiêu
  async settleExpense(expenseId: string, userId: string): Promise<void> {
    const expenseRef = doc(this.firestore, this.expensesCollection, expenseId);
    const expenseDoc = await getDoc(expenseRef);
    const expense = expenseDoc.data() as GroupExpense;

    const updatedSplitBetween = expense.splitBetween.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          status: 'paid',
          paidAt: new Date(),
        };
      }
      return split;
    });

    await updateDoc(expenseRef, {
      splitBetween: updatedSplitBetween,
      status: updatedSplitBetween.every((split) => split.status === 'paid')
        ? 'settled'
        : 'pending',
      updatedAt: new Date(),
    });
  }

  // Xóa nhóm
  async deleteGroup(groupId: string): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const groupDoc = await getDoc(
      doc(this.firestore, this.groupsCollection, groupId)
    );
    const group = groupDoc.data() as Group;

    if (group.createdBy !== userId) {
      throw new Error('Only group admin can delete the group');
    }

    await deleteDoc(doc(this.firestore, this.groupsCollection, groupId));
  }

  // Xóa thành viên khỏi nhóm
  async removeMember(groupId: string, memberId: string): Promise<void> {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const groupRef = doc(this.firestore, this.groupsCollection, groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data() as Group;

      // Kiểm tra quyền xóa (chỉ admin mới được xóa)
      const isAdmin = group.members.some(m => m.userId === userId && m.role === 'admin');
      if (!isAdmin) throw new Error('Only admin can remove members');

      // Không cho phép xóa admin cuối cùng
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      const memberToRemove = group.members.find(m => m.userId === memberId);
      if (memberToRemove?.role === 'admin' && adminCount <= 1) {
        throw new Error('Cannot remove the last admin');
      }

      // Cập nhật danh sách thành viên
      await updateDoc(groupRef, {
        memberIds: group.memberIds.filter(id => id !== memberId),
        members: group.members.filter(m => m.userId !== memberId),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const expenseRef = doc(this.firestore, this.expensesCollection, expenseId);
      const expenseDoc = await getDoc(expenseRef);
      const expense = expenseDoc.data() as GroupExpense;

      // Kiểm tra quyền xóa
      const groupRef = doc(this.firestore, this.groupsCollection, expense.groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data() as Group;

      const isAdmin = group.members.some(m => m.userId === userId && m.role === 'admin');
      const isCreator = expense.paidBy === userId;

      if (!isAdmin && !isCreator) {
        throw new Error('Only expense creator or admin can delete expenses');
      }

      await deleteDoc(expenseRef);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async updateExpense(expenseId: string, data: Partial<GroupExpense>): Promise<void> {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const expenseRef = doc(this.firestore, this.expensesCollection, expenseId);
      const expenseDoc = await getDoc(expenseRef);
      const expense = expenseDoc.data() as GroupExpense;

      // Kiểm tra quyền sửa
      const groupRef = doc(this.firestore, this.groupsCollection, expense.groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data() as Group;

      const isAdmin = group.members.some(m => m.userId === userId && m.role === 'admin');
      const isCreator = expense.paidBy === userId;

      if (!isAdmin && !isCreator) {
        throw new Error('Only expense creator or admin can edit expenses');
      }

      await updateDoc(expenseRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }
}
