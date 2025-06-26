import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { type: 'category' | 'task', id: number, name: string } | null;
}

export function DeleteConfirmationModal({ open, onOpenChange, item }: DeleteConfirmationModalProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      
      const endpoint = item.type === 'category' 
        ? `/api/categories/${item.id}` 
        : `/api/tasks/${item.id}`;
      
      const response = await apiRequest("DELETE", endpoint);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: `${item?.type === 'category' ? 'Category' : 'Task'} deleted successfully`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete "{item?.name}"? 
            {item?.type === 'category' && ' This will also delete all tasks in this category.'} 
            This action cannot be undone.
          </p>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
