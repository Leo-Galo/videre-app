
'use server';

import type { SupportIssue, IssueStatus, IssuePriority } from '@/types/superadmin';
import { subDays } from 'date-fns';

let mockIssues: SupportIssue[] = [];

export async function getIssues(): Promise<SupportIssue[]> {
    return new Promise(resolve => setTimeout(() => resolve(
        [...mockIssues].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ), 50));
}

export async function updateIssue(issueId: string, updates: Partial<Pick<SupportIssue, 'status' | 'priority' | 'resolutionNotes'>>): Promise<boolean> {
    const issueIndex = mockIssues.findIndex(i => i.id === issueId);
    if (issueIndex !== -1) {
        mockIssues[issueIndex] = { ...mockIssues[issueIndex], ...updates, updatedAt: new Date().toISOString() };
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}
