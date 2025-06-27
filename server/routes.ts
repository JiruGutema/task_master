import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertCategorySchema, insertTaskSchema, updateTaskSchema, insertUserSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        res.status(400).json({ message: "Email already exists" });
        return;
      }
      
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        res.status(400).json({ message: "Username already exists" });
        return;
      }
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, fullname: user.fullname } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create account" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, fullname: user.fullname } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      
      res.json({ user: { id: user.id, username: user.username, email: user.email, fullname: user.fullname } });
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Category routes
  app.get("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const categories = await storage.getCategoriesByUser(req.userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const data = insertCategorySchema.omit({ userId: true }).parse(req.body);
      const category = await storage.createCategory({ ...data, userId: req.userId });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, data);
      
      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Task routes
  app.get("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      const { categoryId, search } = req.query;
      
      let tasks;
      if (search) {
        tasks = await storage.searchTasksByUser(req.userId, search as string);
      } else if (categoryId) {
        tasks = await storage.getTasksByCategoryAndUser(parseInt(categoryId as string), req.userId);
      } else {
        tasks = await storage.getTasksByUser(req.userId);
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      const data = insertTaskSchema.omit({ userId: true }).parse(req.body);
      const task = await storage.createTask({ ...data, userId: req.userId });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(id, data);
      
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Export data
  app.get("/api/export", requireAuth, async (req: any, res) => {
    try {
      const categories = await storage.getCategoriesByUser(req.userId);
      const tasks = await storage.getTasksByUser(req.userId);
      
      const exportData = {
        categories,
        tasks,
        exportDate: new Date().toISOString()
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.json"');
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Import data
  app.post("/api/import", requireAuth, async (req: any, res) => {
    try {
      const { categories, tasks } = req.body;
      
      // Import categories first
      const categoryMap = new Map();
      for (const category of categories || []) {
        const newCategory = await storage.createCategory({
          name: category.name,
          color: category.color,
          description: category.description,
          userId: req.userId
        });
        categoryMap.set(category.id, newCategory.id);
      }
      
      // Import tasks with updated category IDs
      for (const task of tasks || []) {
        const newCategoryId = categoryMap.get(task.categoryId) || task.categoryId;
        await storage.createTask({
          title: task.title,
          description: task.description,
          categoryId: newCategoryId,
          priority: task.priority,
          dueDate: task.dueDate,
          userId: req.userId
        });
      }
      
      res.json({ message: "Data imported successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
