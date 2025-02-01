import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/api/todo";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";

type Todo = {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await getTodos();
      setTodos(response.todos);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await addTodo({ title: newTodo.trim() });
      setTodos([response.todo, ...todos]);
      setNewTodo("");
      toast({
        title: "Success",
        description: "Todo added successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await toggleTodo(id, completed);
      setTodos(
        todos.map((todo) =>
          todo._id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((todo) => todo._id !== id));
      toast({
        title: "Success",
        description: "Todo deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newTodo.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <Card key={todo._id} className="bg-card/50 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() =>
                      handleToggleTodo(todo._id, !todo.completed)
                    }
                  />
                  <span
                    className={`${
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTodo(todo._id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}