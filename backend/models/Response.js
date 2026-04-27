// Defines the database schema for submitted form responses.
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String },
  answer: { type: mongoose.Schema.Types.Mixed },
  isCorrect: { type: Boolean, default: null },
  pointsEarned: { type: Number, default: 0 }
});

const responseSchema = new mongoose.Schema({
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  respondentName: { type: String, default: null },
  respondentEmail: { type: String, default: null },
  isAnonymous: { type: Boolean, default: false },
  answers: [answerSchema],
  score: { type: Number, default: null },
  totalPoints: { type: Number, default: null },
  percentage: { type: Number, default: null },
  passed: { type: Boolean, default: null },
  timeTaken: { type: Number, default: null }, // in seconds
  submittedAt: { type: Date, default: Date.now },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null }
}, {
  timestamps: true
});

responseSchema.index({ form: 1, submittedAt: -1 });

module.exports = mongoose.model('Response', responseSchema);
