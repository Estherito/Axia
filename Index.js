const express = require("express");
const app = express();
app.use(express.json());

let allStudents = [
  { id: 1, name: "david", age: 20, maritalStatus: false },
  { id: 2, name: "flora", age: 21, maritalStatus: true },
  { id: 3, name: "mike", age: 50, maritalStatus: true },
  { id: 4, name: "maris", age: 28, maritalStatus: false }
];

let posts = [
  { id: 1, userId: 1, content: "Post by david" },
  { id: 2, userId: 2, content: "Post by flora" }
];

// Get all students
app.get("/", (req, res) => {
  return res.json(allStudents);
});

// Create a user
app.post("/users", (req, res) => {
  const newUser = { id: allStudents.length + 1, ...req.body };
  allStudents.push(newUser);
  return res.status(201).json(newUser);
});

// Delete a user
app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  allStudents = allStudents.filter(user => user.id !== userId);
  return res.status(204).send();
});

// Update a user
app.put("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = allStudents.findIndex(user => user.id === userId);
  if (userIndex !== -1) {
    allStudents[userIndex] = { id: userId, ...req.body };
    return res.json(allStudents[userIndex]);
  }
  return res.status(404).send("User not found");
});

// Get a single user
app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const user = allStudents.find(user => user.id === userId);
  if (user) {
    return res.json(user);
  }
  return res.status(404).send("User not found");
});

// Create a post
app.post("/posts", (req, res) => {
  const newPost = { id: posts.length + 1, ...req.body };
  posts.push(newPost);
  return res.status(201).json(newPost);
});

// Delete a post
app.delete("/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  posts = posts.filter(post => post.id !== postId);
  return res.status(204).send();
});

// Update a post
app.put("/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex(post => post.id === postId);
  if (postIndex !== -1) {
    posts[postIndex] = { id: postId, ...req.body };
    return res.json(posts[postIndex]);
  }
  return res.status(404).send("Post not found");
});

// Get all posts
app.get("/posts", (req, res) => {
  return res.json(posts);
});

// Get a single post
app.get("/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(post => post.id === postId);
  if (post) {
    return res.json(post);
  }
  return res.status(404).send("Post not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});