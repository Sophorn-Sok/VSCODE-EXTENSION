const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json(listUsers());
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json(createUser(name, email));
});

app.get('/api/users/:id', (req, res) => {
  res.json(findUser(req.params.id));
});

app.delete('/api/users/:id', (req, res) => {
  removeUser(req.params.id);
  res.status(204).send();
});

function listUsers() {
  return [];
}

function createUser(name, email) {
  return { name, email };
}

function findUser(id) {
  return { id };
}

function removeUser(id) {
  return id;
}

module.exports = app;
