import api from './api';

// Description: Get user's todo list
// Endpoint: GET /api/todos
// Request: {}
// Response: { todos: Array<{ _id: string, title: string, completed: boolean, createdAt: string }> }
export const getTodos = async () => {
  try {
    const response = await api.get('/api/todos');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Add a new todo
// Endpoint: POST /api/todos
// Request: { title: string }
// Response: { todo: { _id: string, title: string, completed: boolean, createdAt: string } }
export const addTodo = async (data: { title: string }) => {
  try {
    const response = await api.post('/api/todos', data);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Toggle todo completion status
// Endpoint: PATCH /api/todos/:id
// Request: {}
// Response: { success: boolean }
export const toggleTodo = async (id: string, completed: boolean) => {
  try {
    const response = await api.patch(`/api/todos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete a todo
// Endpoint: DELETE /api/todos/:id
// Request: {}
// Response: { success: boolean }
export const deleteTodo = async (id: string) => {
  try {
    const response = await api.delete(`/api/todos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};