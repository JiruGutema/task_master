import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTaskSchema, updateTaskSchema, type Task, type Category } from "@shared/schema";
import { z } from "zod";

const createFormSchema = insertTaskSchema.extend({
  dueDate: z.string().optional(),
});

const updateFormSchema = updateTaskSchema.extend({
  dueDate: z.string().optional(),
});

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  categories: Category[];
  defaultCategoryId?: number | null;
}

export function TaskModal({ open, onOpenChange, task, categories, defaultCategoryId }: TaskModalProps) {
  const { toast } = useToast();
  const isEditing = !!task;

  const form = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: defaultCategoryId || undefined,
      priority: "medium",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        priority: task.priority,
        dueDate: task.dueDate || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        categoryId: defaultCategoryId || undefined,
        priority: "medium",
        dueDate: "",
      });
    }
  }, [task, defaultCategoryId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createFormSchema>) => {
      const response = await apiRequest("POST", "/api/tasks", {
        ...data,
        dueDate: data.dueDate || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateFormSchema>) => {
      const response = await apiRequest("PUT", `/api/tasks/${task!.id}`, {
        ...data,
        dueDate: data.dueDate || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      const response = await apiRequest("PUT", `/api/tasks/${task!.id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof createFormSchema>) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (categories.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>No Categories Available</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">You need to create at least one category before adding tasks.</p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="completed"
                  checked={task?.completed || false}
                  onChange={(e) => toggleCompletionMutation.mutate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="completed" className="text-sm font-medium">
                  Mark as completed
                </label>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
