// Handles submitting responses and managing saved form answers.
const Form = require('../models/Form');
const Response = require('../models/Response');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlankAnswer = (question, answer) => {
  if (answer === null || answer === undefined) return true;
  if (typeof answer === 'string') return answer.trim() === '';
  if (question.type === 'checkbox' && Array.isArray(answer)) return answer.length === 0;
  return false;
};

const getInvalidAnswerMessage = (question) => {
  switch (question.type) {
    case 'multiple_choice':
    case 'dropdown':
    case 'true_false':
      return `"${question.question}" must have one valid selected option`;
    case 'checkbox':
      return `"${question.question}" must have valid selected options`;
    case 'short_answer':
    case 'paragraph':
      return `"${question.question}" must have a text answer`;
    case 'rating':
      return `"${question.question}" must have a rating between 1 and ${question.ratingMax || 5}`;
    default:
      return `Invalid answer submitted for "${question.question}"`;
  }
};

const isValidAnswerForQuestion = (question, answer) => {
  const options = question.options || [];

  switch (question.type) {
    case 'multiple_choice':
    case 'dropdown':
    case 'true_false':
      return typeof answer === 'string' && options.includes(answer);
    case 'checkbox':
      return Array.isArray(answer) &&
        answer.length > 0 &&
        answer.every(option => typeof option === 'string' && options.includes(option)) &&
        new Set(answer).size === answer.length;
    case 'short_answer':
    case 'paragraph':
      return typeof answer === 'string';
    case 'rating':
      return Number.isInteger(answer) && answer >= 1 && answer <= (question.ratingMax || 5);
    default:
      return false;
  }
};

const formatCsvValue = (value) => {
  if (Array.isArray(value)) return value.join('; ');
  if (value === null || value === undefined) return '';
  return String(value);
};

const escapeCsvCell = (value) => {
  const stringValue = formatCsvValue(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

// Submit a response to a form
exports.submitResponse = async (req, res) => {
  try {
    const form = await Form.findOne({ publicId: req.params.publicId, status: 'published' });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found or not accepting responses' });

    // Check expiry
    if (form.expiresAt && new Date() > form.expiresAt) {
      return res.status(400).json({ success: false, message: 'This form has expired' });
    }

    const { answers, respondentName, respondentEmail, isAnonymous, timeTaken } = req.body;
    const shouldStoreAnonymously = Boolean(form.settings.allowAnonymous || isAnonymous);
    const normalizedName = typeof respondentName === 'string' ? respondentName.trim() : '';
    const normalizedEmail = typeof respondentEmail === 'string' ? respondentEmail.trim().toLowerCase() : '';

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers must be submitted as an array' });
    }

    if (!shouldStoreAnonymously) {
      if (!normalizedName) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      if (!normalizedEmail) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address' });
      }
    }

    if (!form.settings.allowMultipleResponses && !shouldStoreAnonymously && normalizedEmail) {
      const existing = await Response.findOne({ form: form._id, respondentEmail: normalizedEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already submitted a response' });
      }
    }

    const questionMap = new Map(form.questions.map(question => [question.id, question]));
    const seenQuestionIds = new Set();
    const normalizedAnswers = [];

    for (const entry of answers) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return res.status(400).json({ success: false, message: 'Each submitted answer must be an object' });
      }

      const questionId = typeof entry.questionId === 'string' ? entry.questionId.trim() : '';
      if (!questionId) {
        return res.status(400).json({ success: false, message: 'Each answer must include a valid questionId' });
      }

      if (seenQuestionIds.has(questionId)) {
        return res.status(400).json({ success: false, message: `Duplicate answer submitted for question ${questionId}` });
      }

      const question = questionMap.get(questionId);
      if (!question) {
        return res.status(400).json({ success: false, message: `Invalid questionId submitted: ${questionId}` });
      }

      seenQuestionIds.add(questionId);

      const answer = entry.answer;
      const blankAnswer = isBlankAnswer(question, answer);

      if (question.required && blankAnswer) {
        return res.status(400).json({ success: false, message: `"${question.question}" is required` });
      }

      if (!blankAnswer && !isValidAnswerForQuestion(question, answer)) {
        return res.status(400).json({ success: false, message: getInvalidAnswerMessage(question) });
      }

      normalizedAnswers.push({
        questionId,
        answer: blankAnswer ? (question.type === 'checkbox' ? [] : '') : answer
      });
    }

    for (const question of form.questions) {
      if (question.required && !seenQuestionIds.has(question.id)) {
        return res.status(400).json({ success: false, message: `"${question.question}" is required` });
      }
    }

    // Calculate score for quizzes
    let score = null, totalPoints = null, percentage = null, passed = null;

    const processedAnswers = normalizedAnswers.map(answer => {
      const question = form.questions.find(q => q.id === answer.questionId);
      let isCorrect = null;
      let pointsEarned = 0;

      if (form.type === 'quiz' && question && question.correctAnswer !== null && question.correctAnswer !== undefined) {
        const correct = question.correctAnswer;
        const given = answer.answer;

        if (Array.isArray(correct)) {
          isCorrect = Array.isArray(given) &&
            correct.length === given.length &&
            correct.every(c => given.includes(c));
        } else {
          isCorrect = String(correct).toLowerCase().trim() === String(given).toLowerCase().trim();
        }

        if (isCorrect) pointsEarned = question.points || 1;
      }

      return {
        questionId: answer.questionId,
        questionText: question?.question || '',
        answer: answer.answer,
        isCorrect,
        pointsEarned
      };
    });

    if (form.type === 'quiz') {
      score = processedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
      totalPoints = form.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      passed = form.settings.passingScore ? percentage >= form.settings.passingScore : null;
    }

    const response = await Response.create({
      form: form._id,
      respondent: req.user?._id || null,
      respondentName: shouldStoreAnonymously ? null : normalizedName,
      respondentEmail: shouldStoreAnonymously ? null : normalizedEmail,
      isAnonymous: shouldStoreAnonymously,
      answers: processedAnswers,
      score,
      totalPoints,
      percentage,
      passed,
      timeTaken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Update form response count
    await Form.findByIdAndUpdate(form._id, { $inc: { totalResponses: 1 } });

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      result: {
        score: form.settings.showScore ? score : null,
        totalPoints: form.settings.showScore ? totalPoints : null,
        percentage: form.settings.showScore ? percentage : null,
        passed,
        correctAnswers: form.settings.showCorrectAnswers
          ? processedAnswers.map(answer => {
              const question = form.questions.find(q => q.id === answer.questionId);
              return {
                ...answer,
                correctAnswer: question?.correctAnswer ?? null
              };
            })
          : null,
        confirmationMessage: form.settings.confirmationMessage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//
// Get responses for a form (creator only)
exports.getFormResponses = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const { page = 1, limit = 20, sort = '-submittedAt' } = req.query;

    const total = await Response.countDocuments({ form: form._id });
    const responses = await Response.find({ form: form._id })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      responses,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export responses for a form as CSV
exports.exportFormResponsesCsv = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const responses = await Response.find({ form: form._id }).sort('-submittedAt');
    const questionColumns = form.questions.map(question => question.question);
    const baseHeaders = ['Respondent Name', 'Respondent Email', 'Submitted At'];
    const quizHeaders = form.type === 'quiz'
      ? ['Score', 'Percentage', 'Pass/Fail']
      : [];
    const headers = [...baseHeaders, ...quizHeaders, ...questionColumns];

    const rows = responses.map((response) => {
      const answerMap = new Map(response.answers.map(answer => [answer.questionId, answer.answer]));
      const respondentName = response.isAnonymous
        ? 'Anonymous Respondent'
        : (response.respondentName || 'Anonymous Respondent');
      const respondentEmail = response.isAnonymous
        ? ''
        : (response.respondentEmail || '');

      const baseValues = [
        respondentName,
        respondentEmail,
        response.submittedAt ? new Date(response.submittedAt).toISOString() : ''
      ];

      const quizValues = form.type === 'quiz'
        ? [
            response.score ?? '',
            response.percentage ?? '',
            response.passed === null ? '' : (response.passed ? 'Passed' : 'Failed')
          ]
        : [];

      const questionValues = form.questions.map(question => answerMap.get(question.id) ?? '');

      return [...baseValues, ...quizValues, ...questionValues];
    });

    const csv = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\n');

    const fileName = `${form.title || 'form'}-responses.csv`
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'responses.csv'}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a response
exports.deleteResponse = async (req, res) => {
  try {
    const response = await Response.findById(req.params.id).populate('form');
    if (!response) return res.status(404).json({ success: false, message: 'Response not found' });
    if (response.form.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await response.deleteOne();
    await Form.findByIdAndUpdate(response.form._id, { $inc: { totalResponses: -1 } });

    res.json({ success: true, message: 'Response deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
