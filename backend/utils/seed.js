require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Form = require('../models/Form');
const Response = require('../models/Response');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  await User.deleteMany({});
  await Form.deleteMany({});
  await Response.deleteMany({});

  // Create demo users
  const alice = await User.create({
    name: 'Alice Johnson',
    email: 'alice@demo.com',
    password: 'password123',
    bio: 'Teacher and quiz creator'
  });

  const bob = await User.create({
    name: 'Bob Smith',
    email: 'bob@demo.com',
    password: 'password123',
    bio: 'Researcher and survey enthusiast'
  });

  // Create sample quiz
  const quiz = await Form.create({
    creator: alice._id,
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your JavaScript knowledge with this beginner-friendly quiz!',
    type: 'quiz',
    category: 'education',
    status: 'published',
    coverColor: '#6366f1',
    settings: {
      showScore: true,
      showCorrectAnswers: true,
      timeLimit: 15,
      passingScore: 60
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What does "var" stand for in JavaScript?',
        options: ['Variable', 'Variant', 'Variation', 'Value'],
        correctAnswer: 'Variable',
        points: 1,
        required: true,
        order: 0
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'JavaScript is a statically typed language.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 1,
        required: true,
        order: 1
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'Which method is used to add an element at the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 'push()',
        points: 2,
        required: true,
        order: 2
      },
      {
        id: 'q4',
        type: 'short_answer',
        question: 'What keyword is used to declare a constant in JavaScript?',
        correctAnswer: 'const',
        points: 1,
        required: true,
        order: 3
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'What is the output of: typeof null?',
        options: ['"null"', '"object"', '"undefined"', '"string"'],
        correctAnswer: '"object"',
        points: 2,
        required: true,
        order: 4
      }
    ]
  });

  // Create sample survey
  const survey = await Form.create({
    creator: bob._id,
    title: 'Remote Work Experience Survey',
    description: 'Help us understand how remote work is affecting productivity and wellbeing.',
    type: 'survey',
    category: 'research',
    status: 'published',
    coverColor: '#10b981',
    settings: {
      allowAnonymous: true,
      confirmationMessage: 'Thank you for sharing your experience!'
    },
    questions: [
      {
        id: 's1',
        type: 'multiple_choice',
        question: 'How long have you been working remotely?',
        options: ['Less than 6 months', '6-12 months', '1-2 years', 'More than 2 years'],
        required: true,
        order: 0
      },
      {
        id: 's2',
        type: 'rating',
        question: 'How would you rate your overall remote work experience?',
        ratingMax: 5,
        required: true,
        order: 1
      },
      {
        id: 's3',
        type: 'checkbox',
        question: 'What are the biggest challenges you face while working remotely?',
        options: ['Communication', 'Distractions at home', 'Loneliness', 'Work-life balance', 'Technical issues'],
        required: false,
        order: 2
      },
      {
        id: 's4',
        type: 'paragraph',
        question: 'What tools or practices have helped you stay productive?',
        required: false,
        order: 3
      },
      {
        id: 's5',
        type: 'multiple_choice',
        question: 'Would you prefer to continue working remotely after the pandemic?',
        options: ['Yes, fully remote', 'Hybrid model', 'Back to office', 'No preference'],
        required: true,
        order: 4
      }
    ]
  });

  // Add some sample responses to the quiz
  const quizResponses = [
    { name: 'Charlie', answers: ['Variable', 'False', 'push()', 'const', '"object"'], score: 7 },
    { name: 'Diana', answers: ['Variant', 'True', 'push()', 'const', '"null"'], score: 3 },
    { name: 'Eve', answers: ['Variable', 'False', 'push()', 'var', '"object"'], score: 6 },
    { name: 'Frank', answers: ['Variable', 'False', 'pop()', 'const', '"object"'], score: 5 },
    { name: 'Grace', answers: ['Variable', 'False', 'push()', 'const', '"object"'], score: 7 },
  ];

  const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const correctAnswers = ['Variable', 'False', 'push()', 'const', '"object"'];
  const points = [1, 1, 2, 1, 2];

  for (const r of quizResponses) {
    const answers = r.answers.map((a, i) => ({
      questionId: questionIds[i],
      questionText: quiz.questions[i].question,
      answer: a,
      isCorrect: a === correctAnswers[i],
      pointsEarned: a === correctAnswers[i] ? points[i] : 0
    }));
    const score = answers.reduce((s, a) => s + a.pointsEarned, 0);
    const totalPoints = 7;
    const percentage = Math.round((score / totalPoints) * 100);

    await Response.create({
      form: quiz._id,
      respondentName: r.name,
      answers,
      score,
      totalPoints,
      percentage,
      passed: percentage >= 60,
      submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    });
  }

  await Form.findByIdAndUpdate(quiz._id, { totalResponses: quizResponses.length });

  console.log('✅ Seed complete!');
  console.log('Demo accounts:');
  console.log('  alice@demo.com / password123');
  console.log('  bob@demo.com / password123');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
