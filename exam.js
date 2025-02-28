const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const Joi = require('joi');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan('tiny'));

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Mongoose models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  kyc: { type: mongoose.Schema.Types.ObjectId, ref: 'KYC' },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

const User = mongoose.model('User', userSchema);

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: String, required: true }
});

const KYC = mongoose.model('KYC', kycSchema);

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
});

const Post = mongoose.model('Post', postSchema);

// Validation functions
const validateUser = (user) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(8).required()
  });
  return schema.validate(user);
};

const validateKYC = (kyc) => {
  const schema = Joi.object({
    document: Joi.string().required()
  });
  return schema.validate(kyc);
};

const validatePost = (post) => {
  const schema = Joi.object({
    content: Joi.string().required()
  });
  return schema.validate(post);
};

// Middleware for authentication
const auth = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });

  try {
    await user.save();
    res.status(201).send('User registered');
  } catch (err) {
    res.status(400).send('Username already exists');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('Invalid credentials');

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

app.delete('/api/user/delete', auth, async (req, res) => {
  const userId = req.user.userId;
  await KYC.deleteOne({ user: userId });
  await Post.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);
  res.send('User and associated data deleted');
});

app.post('/api/kyc', auth, async (req, res) => {
  const { error } = validateKYC(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { document } = req.body;
  const kyc = new KYC({ user: req.user.userId, document });
  await kyc.save();
  res.status(201).send('KYC created');
});

app.post('/api/post', auth, async (req, res) => {
  const { error } = validatePost(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { content } = req.body;
  const post = new Post({ user: req.user.userId, content });
  await post.save();
  res.status(201).send('Post created');
});

// Connect to MongoDB and start the server
mongoose.connect(process.env.DB_URI)
  .then(() => app.listen(3000, () => console.log('Server running on port 3000')))
  .catch(err => console.error(err));