import { eq, and, like, or } from 'drizzle-orm';
import { db, users, categories, tasks } from './db';
import type { 
  User, 
  InsertUser, 
  Category, 
  InsertCategory, 
  Task, 
  InsertTask, 
  UpdateTask 
} from '@shared/schema';
import type { IStorage } from './storage';
import 'dotenv/config';
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Category methods
  async getCategoriesByUser(userId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.categoryId, id));
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Task methods
  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.createdAt);
  }

  async getTasksByCategoryAndUser(categoryId: number, userId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(and(eq(tasks.categoryId, categoryId), eq(tasks.userId, userId)))
      .orderBy(tasks.createdAt);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: number, updateData: UpdateTask): Promise<Task | undefined> {
    const result = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async searchTasksByUser(userId: number, query: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        or(
          like(tasks.title, `%${query}%`),
          like(tasks.description, `%${query}%`)
        )
      ))
      .orderBy(tasks.createdAt);
  }
}