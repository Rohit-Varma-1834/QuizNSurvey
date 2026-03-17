const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const questionSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4() },
  type: {
    type: String,
    enum: ['multiple_choice', 'checkbox', 'short_answer', 'paragraph', 'true_false', 'rating', 'dropdown'],
    required: true
  },
  question: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null }, // for quizzes
  points: { type: Number, default: 1 },
  ratingMax: { type: Number, default: 5 },
  order: { type: Number, default: 0 }
});

const formSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['quiz', 'survey'],
    required: true
  },
  category: {
    type: String,
    enum: ['education', 'business', 'feedback', 'research', 'events', 'other'],
    default: 'other'
  },
  questions: [questionSchema],
  settings: {
    // Quiz settings
    showScore: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    timeLimit: { type: Number, default: null }, // in minutes
    passingScore: { type: Number, default: null }, // percentage
    // Survey settings
    allowAnonymous: { type: Boolean, default: false },
    // Common settings
    allowMultipleResponses: { type: Boolean, default: false },
    showProgressBar: { type: Boolean, default: true },
    confirmationMessage: { type: String, default: 'Thank you for your submission!' }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  publicId: {
    type: String,
    unique: true,
    default: () => uuidv4().replace(/-/g, '').substring(0, 12)
  },
  qrCode: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  totalResponses: { type: Number, default: 0 },
  tags: [{ type: String }],
  coverColor: { type: String, default: '#6366f1' }
}, {
  timestamps: true
});

// Index for faster queries
formSchema.index({ creator: 1, status: 1 });

module.exports = mongoose.model('Form', formSchema);
