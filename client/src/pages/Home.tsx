import { TodoList } from "@/components/TodoList";

export function Home() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold mb-8">My Todo List</h1>
      <TodoList />
    </div>
  );
}