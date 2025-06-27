import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, Trash2 } from "lucide-react";
import type { Task, Category } from "@shared/schema";

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-amber-100 text-amber-800", 
  high: "bg-blue-100 text-blue-800",
};

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  category: Category | undefined;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskDetailModal({ open, onOpenChange, task, category, onEdit, onDelete }: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg sm:w-full resize overflow-auto max-h-[90vh] mx-4 bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl" style={{ minWidth: '300px', minHeight: '350px' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Task Details</span>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="hover:bg-blue-100/50 rounded-xl" onClick={() => onEdit(task)}>
                <Edit size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-red-100/50 rounded-xl" onClick={() => onDelete(task)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          <div>
            <h3 className={`text-xl font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {task.completed && (
              <Badge className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Category</h4>
              <p className="text-gray-600">{category?.name || 'Unknown'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Priority</h4>
              <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {task.priority} Priority
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {task.dueDate && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2" />
              <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}