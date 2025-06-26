import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ListTodo, Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryModal } from "@/components/category-modal";
import { TaskModal } from "@/components/task-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
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

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'category' | 'task', id: number, name: string } | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", selectedCategoryId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategoryId) params.append("categoryId", selectedCategoryId.toString());
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
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

  const handleAddTask = () => {
    if (categories.length === 0) {
      // Show message to create categories first
      return;
    }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  if (categoriesLoading) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ListTodo className="text-blue-500 mr-3" size={28} />
            TaskFlow
          </h1>
          <p className="text-sm text-gray-500 mt-1">Organize your productivity</p>
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

            <div className="space-y-3">
              {categories.map((category) => {
                const categoryTasks = tasks.filter(t => t.categoryId === category.id);
                const isSelected = selectedCategoryId === category.id;
                
                return (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
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
                          <i className="fas fa-edit text-sm" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category);
                          }}
                        >
                          <i className="fas fa-trash text-sm" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1" size="sm">
              <Download size={16} className="mr-2" />
              Export
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <Upload size={16} className="mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory ? `${selectedCategory.name} ListTodo` : searchQuery ? 'Search Results' : 'All ListTodo'}
              </h2>
              <p className="text-gray-500 mt-1">
                {selectedCategory ? `Manage your ${selectedCategory.name.toLowerCase()} tasks` : 'Manage all your tasks'}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleAddTask}>
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
              <span className="text-sm text-gray-600">Total: <span className="font-semibold">{tasks.length}</span></span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2" />
              <span className="text-sm text-gray-600">Completed: <span className="font-semibold">{completedTasks}</span></span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-amber-500 rounded mr-2" />
              <span className="text-sm text-gray-600">Pending: <span className="font-semibold">{pendingTasks}</span></span>
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
              <Button onClick={handleAddTask}>
                <Plus size={16} className="mr-2" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className={`transition-all hover:shadow-md ${task.completed ? 'opacity-75' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => {
                            // Handle task completion toggle
                            // This will be implemented in the task modal
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className={`font-semibold text-gray-900 mb-1 ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {task.dueDate && (
                              <span>
                                <i className="fas fa-calendar mr-1" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            <span>
                              <i className="fas fa-clock mr-1" />
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
                          onClick={() => handleEditTask(task)}
                        >
                          <i className="fas fa-edit" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task)}
                        >
                          <i className="fas fa-trash" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
    </div>
  );
}
