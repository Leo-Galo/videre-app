// src/services/user-service.ts
'use server';

import type { ClinicUser, UserStatus } from '@/types/user';
import type { CreateUserFormValues, EditUserFormValues } from '@/types/user-schema';

const USERS_STORAGE_KEY = 'videreClinicUsers';

const initialMockClinicUsers: ClinicUser[] = [];

const getStoredData = (): ClinicUser[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialMockClinicUsers));
    return initialMockClinicUsers;
};

const saveData = (users: ClinicUser[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export async function getUsers(): Promise<ClinicUser[]> {
    const users = getStoredData();
    return new Promise(resolve => setTimeout(() => resolve(users), 50));
}

export async function getUserById(userId: string): Promise<ClinicUser | null> {
    const users = getStoredData();
    const user = users.find(u => u.id === userId) || null;
    return new Promise(resolve => setTimeout(() => resolve(user), 50));
}

export async function addUser(userData: CreateUserFormValues): Promise<ClinicUser | null> {
    const users = getStoredData();
    const newUser: ClinicUser = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'Active',
        createdAt: new Date().toISOString(),
    };
    saveData([...users, newUser]);
    return new Promise(resolve => setTimeout(() => resolve(newUser), 50));
}

export async function updateUser(userId: string, updateData: EditUserFormValues): Promise<ClinicUser | null> {
    let users = getStoredData();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    const updatedUser = { ...users[index], ...updateData };
    users[index] = updatedUser;
    saveData(users);
    return new Promise(resolve => setTimeout(() => resolve(updatedUser), 50));
}

export async function toggleUserStatus(userId: string, newStatus: UserStatus): Promise<boolean> {
    let users = getStoredData();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].status = newStatus;
        saveData(users);
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<boolean> {
    console.log(`Simulating password change for user ${userId} to "${newPassword}"`);
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
}
