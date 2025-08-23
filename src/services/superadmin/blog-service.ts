
'use server';

import type { BlogPostItem } from '@/types/superadmin';
import type { BlogPostFormValues } from '@/types/superadmin-schemas';

const BLOG_POSTS_STORAGE_KEY = 'videreSuperAdminBlogPosts';

const initialBlogPostsData: BlogPostItem[] = [];

const getStoredData = (): BlogPostItem[] => {
  if (typeof window === 'undefined') return initialBlogPostsData;
  try {
    const stored = localStorage.getItem(BLOG_POSTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(initialBlogPostsData));
    return initialBlogPostsData;
  } catch (error) {
    console.error("Error with localStorage:", error);
    return initialBlogPostsData;
  }
};

const saveDataToStorage = (data: BlogPostItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(sortedData));
    window.dispatchEvent(new StorageEvent('storage', { key: BLOG_POSTS_STORAGE_KEY, newValue: JSON.stringify(sortedData) }));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export async function getBlogPosts(): Promise<BlogPostItem[]> {
  const posts = getStoredData();
  return new Promise(resolve => setTimeout(() => resolve([...posts]), 50));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostItem | null> {
  const posts = getStoredData();
  const post = posts.find(p => p.slug === slug) || null;
  return new Promise(resolve => setTimeout(() => resolve(post), 50));
}

export async function addBlogPost(values: BlogPostFormValues): Promise<BlogPostItem> {
  const posts = getStoredData();
  const newPost: BlogPostItem = {
    id: `blog-${Date.now()}`,
    title: values.title,
    slug: values.slug,
    author: values.author,
    content: values.content,
    image: values.image || undefined,
    dataAiHint: values.dataAiHint || undefined,
    tags: values.tagsInput ? values.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    status: values.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updatedPosts = [newPost, ...posts];
  saveDataToStorage(updatedPosts);
  return new Promise(resolve => setTimeout(() => resolve(newPost), 50));
}

export async function updateBlogPost(postId: string, updateData: Partial<BlogPostItem>): Promise<boolean> {
  let posts = getStoredData();
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex !== -1) {
    posts[postIndex] = { ...posts[postIndex], ...updateData, updatedAt: new Date().toISOString() };
    saveDataToStorage(posts);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}

export async function deleteBlogPost(postId: string): Promise<boolean> {
  let posts = getStoredData();
  const initialLength = posts.length;
  posts = posts.filter(p => p.id !== postId);
  if (posts.length < initialLength) {
    saveDataToStorage(posts);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}
