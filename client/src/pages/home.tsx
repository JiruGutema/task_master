import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Search, Plus, ListTodo, Download, Upload, Edit, Trash2, Calendar, Clock, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryModal } from "@/components/category-modal";
import { TaskModal } from "@/components/task-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { TaskDetailModal } from "@/components/task-detail-modal";
import type { Category, Task } from "@shared/schema";

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-blue-100 text-blue-800",
};

interface HomeProps {
  user: { id: number; username: string; email: string; fullname: string };
  onLogout: () => void;
}

export default function Home({ user, onLogout }: HomeProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'category' | 'task', id: number, name: string } | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);


  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", selectedCategoryId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategoryId) params.append("categoryId", selectedCategoryId.toString());
      if (searchQuery) params.append("search", searchQuery);
      
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`/api/tasks?${params}`, { headers });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const { mutate: toggleTaskCompletion } = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number; completed: boolean }) => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ completed })
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });

  const { mutate: updateTaskCategory } = useMutation({
    mutationFn: async ({ taskId, categoryId }: { taskId: number; categoryId: number }) => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ categoryId })
      });
      if (!response.ok) throw new Error('Failed to update task category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });

  const { mutate: importData } = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to import data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });

  const selectedCategory = selectedCategoryId 
    ? categories.find(c => c.id === selectedCategoryId)
    : null;

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteItem({ type: 'category', id: category.id, name: category.name });
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteItem({ type: 'task', id: task.id, name: task.title });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    if (type === 'task') {
      const taskId = parseInt(draggableId.replace('task-', ''));
      const newCategoryId = parseInt(destination.droppableId.replace('category-', ''));
      updateTaskCategory({ taskId, categoryId: newCategoryId });
    }
    // Category reordering could be implemented here if needed
  };

  const handleAddTask = () => {
    if (categories.length === 0) {
      // Show message to create categories first
      return;
    }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch('/api/export', { headers });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importData(data);
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  if (categoriesLoading) return <div>Loading...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Desktop Layout */}
        <div className="h-full relative z-10">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-screen bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ListTodo className="text-blue-500 mr-3" size={28} />
                TaskFlow
              </h1>
              <p className="text-sm text-gray-500 mt-1">Welcome, {user.fullname}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
              <Button 
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            </div>

            <Droppable droppableId="categories" type="category">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {categories.map((category, index) => {
                    const categoryTasks = tasks.filter(t => t.categoryId === category.id);
                    const isSelected = selectedCategoryId === category.id;
                    
                    return (
                      <Draggable key={category.id} draggableId={`category-${category.id}`} index={index}>
                        {(provided, snapshot) => (
                          <Droppable droppableId={`category-${category.id}`} type="task">
                            {(dropProvided, dropSnapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 rounded-lg transition-all cursor-pointer ${
                                  isSelected ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-gray-100'
                                } ${dropSnapshot.isDraggingOver ? 'bg-blue-100 border-blue-300 border-2' : ''} ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}`}
                                onClick={() => handleCategoryClick(category.id)}
                              >
                                <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div {...provided.dragHandleProps} className="mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={12} />
                                      </div>
                                      <div className={`w-3 h-3 rounded-full mr-3 ${colorMap[category.color as keyof typeof colorMap] || 'bg-gray-500'}`} />
                                      <span className="font-medium text-gray-800">{category.name}</span>
                                      <Badge variant="secondary" className="ml-2">
                                        {categoryTasks.length}
                                      </Badge>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCategory(category);
                                        }}
                                      >
                                        <Edit size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCategory(category);
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                  {dropProvided.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1" size="sm" onClick={handleExport}>
              <Download size={16} className="mr-2" />
              Export
            </Button>
            <Button variant="outline" className="flex-1" size="sm" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload size={16} className="mr-2" />
              Import
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
          <Panel defaultSize={75}>
            <div className="h-screen flex flex-col">
        {/* Header Bar */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {selectedCategory ? `${selectedCategory.name} Tasks` : searchQuery ? 'Search Results' : 'All Tasks'}
              </h2>
              <p className="text-gray-600 mt-1 font-medium">
                {selectedCategory ? `Manage your ${selectedCategory.name.toLowerCase()} tasks` : 'Manage all your tasks'}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl" onClick={handleAddTask}>
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="bg-white/60 backdrop-blur-sm shadow-md border-b border-white/20 px-6 py-4">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-2 shadow-sm" />
              <span className="text-sm text-gray-700 font-medium">Total: <span className="font-bold text-blue-600">{tasks.length}</span></span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-2 shadow-sm" />
              <span className="text-sm text-gray-700 font-medium">Completed: <span className="font-bold text-green-600">{completedTasks}</span></span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mr-2 shadow-sm" />
              <span className="text-sm text-gray-700 font-medium">Pending: <span className="font-bold text-amber-600">{pendingTasks}</span></span>
            </div>
          </div>
        </div>

        {/* ListTodo List */}
        <div className="flex-1 overflow-y-auto p-6">
          {tasksLoading ? (
            <div>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="text-gray-300 mx-auto mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first task</p>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl" onClick={handleAddTask}>
                <Plus size={16} className="mr-2" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <Droppable droppableId="tasks" type="task">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {tasks.map((task, index) => {
                    const taskCategory = categories.find(c => c.id === task.categoryId);
                    return (
                      <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`transition-all hover:shadow-xl cursor-pointer bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:scale-[1.02] rounded-xl ${task.completed ? 'opacity-75' : ''} ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105' : ''}`} 
                            onClick={() => handleTaskClick(task)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div {...provided.dragHandleProps} className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={16} />
                                  </div>
                                  <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={(checked) => {
                                      toggleTaskCompletion({ taskId: task.id, completed: !!checked });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <h3 className={`font-semibold text-gray-900 mb-1 ${task.completed ? 'line-through' : ''}`}>
                                      {task.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      {task.dueDate && (
                                        <span className="flex items-center">
                                          <Calendar size={12} className="mr-1" />
                                          Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      <span className="flex items-center">
                                        <Clock size={12} className="mr-1" />
                                        Created: {new Date(task.createdAt).toLocaleDateString()}
                                      </span>
                                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                                        {task.priority} Priority
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
          </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        category={editingCategory}
      />

      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        task={editingTask}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
      />

      <DeleteConfirmationModal
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        item={deleteItem}
      />

      <TaskDetailModal
        open={showTaskDetail}
        onOpenChange={setShowTaskDetail}
        task={selectedTask}
        category={selectedTask ? categories.find(c => c.id === selectedTask.categoryId) : undefined}
        onEdit={(task) => {
          setShowTaskDetail(false);
          handleEditTask(task);
        }}
        onDelete={(task) => {
          setShowTaskDetail(false);
          handleDeleteTask(task);
        }}
      />
    </DragDropContext>
  );
}
