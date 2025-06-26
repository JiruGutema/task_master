import { 
  categories, 
  tasks, 
  users, 
  type Category, 
  type Task, 
  type InsertCategory, 
  type InsertTask, 
  type UpdateTask, 
  type User, 
  type InsertUser 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Task methods
  getTasks(): Promise<Task[]>;
  getTasksByCategory(categoryId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  searchTasks(query: string): Promise<Task[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private tasks: Map<number, Task>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentTaskId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.tasks = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentTaskId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory: Category = { ...category, ...updateData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const deleted = this.categories.delete(id);
    if (deleted) {
      // Also delete all tasks in this category
      const tasksToDelete = Array.from(this.tasks.entries())
        .filter(([_, task]) => task.categoryId === id)
        .map(([taskId]) => taskId);
      
      tasksToDelete.forEach(taskId => this.tasks.delete(taskId));
    }
    return deleted;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTasksByCategory(categoryId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.categoryId === categoryId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      completed: false,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: UpdateTask): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { ...task, ...updateData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async searchTasks(query: string): Promise<Task[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tasks.values())
      .filter(task => 
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
