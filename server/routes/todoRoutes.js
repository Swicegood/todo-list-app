const express = require('express');
const TodoService = require('../services/todoService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// All routes require authentication
router.use(requireUser);

router.get('/', async (req, res) => {
  console.log('GET /todos - Request details:', {
    userId: req.user._id,
    headers: req.headers,
    authHeader: req.headers.authorization
  });
  try {
    const todos = await TodoService.list(req.user._id);
    console.log('GET /todos - Retrieved todos:', {
      userId: req.user._id,
      todoCount: todos.length,
      todos: todos.map(t => ({ id: t._id, title: t.title, user: t.user }))
    });
    res.json({ todos });
  } catch (error) {
    console.error('GET /todos - Error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  console.log('POST /todos - Request details:', {
    userId: req.user._id,
    todoData: req.body,
    headers: req.headers.authorization
  });
  try {
    const todo = await TodoService.create(req.user._id, req.body);
    console.log('POST /todos - Created todo:', {
      userId: req.user._id,
      todo: { id: todo._id, title: todo.title, user: todo.user }
    });
    res.json({ todo });
  } catch (error) {
    console.error('POST /todos - Error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const todo = await TodoService.toggle(req.user._id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await TodoService.delete(req.user._id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;