import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("blue"),
  description: text("description").default(""),
  userId: integer("user_id").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  dueDate: text("due_date"), // ISO string format
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
  description: true,
  userId: true,
}).extend({
  description: z.string().optional(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  categoryId: true,
  priority: true,
  dueDate: true,
  userId: true,
});

export const updateTaskSchema = insertTaskSchema.partial().extend({
  completed: z.boolean().optional(),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullname: text("fullname").notNull(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  fullname: true,
  password: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
