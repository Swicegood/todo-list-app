const mongoose = require('mongoose');
const Todo = require('../models/Todo.js');

class TodoService {
  static async list(userId) {
    console.log('TodoService.list - Finding todos for user:', userId);
    try {
      const todos = await Todo.find({ user: userId }).sort({ createdAt: -1 });
      console.log('TodoService.list - Found todos:', todos);
      return todos;
    } catch (err) {
      console.error('TodoService.list - Error:', err);
      throw new Error(`Database error while listing todos: ${err}`);
    }
  }

  static async create(userId, data) {
    console.log('TodoService.create - Creating todo for user:', userId, 'with data:', data);
    try {
      const todo = new Todo({
        title: data.title,
        user: userId
      });
      const savedTodo = await todo.save();
      console.log('TodoService.create - Created todo:', savedTodo);
      return savedTodo;
    } catch (err) {
      console.error('TodoService.create - Error:', err);
      throw new Error(`Database error while creating todo: ${err}`);
    }
  }

  static async toggle(userId, todoId) {
    try {
      const todo = await Todo.findOne({ _id: todoId, user: userId });
      if (!todo) {
        throw new Error('Todo not found');
      }
      todo.completed = !todo.completed;
      return await todo.save();
    } catch (err) {
      throw new Error(`Database error while toggling todo: ${err}`);
    }
  }

  static async delete(userId, todoId) {
    try {
      const result = await Todo.deleteOne({ _id: todoId, user: userId });
      if (result.deletedCount === 0) {
        throw new Error('Todo not found');
      }
      return true;
    } catch (err) {
      throw new Error(`Database error while deleting todo: ${err}`);
    }
  }
}

module.exports = TodoService;