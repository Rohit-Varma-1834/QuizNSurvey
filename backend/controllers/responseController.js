const Form = require('../models/Form');
const Response = require('../models/Response');

// Submit a response to a form
exports.submitResponse = async (req, res) => {
  try {
    const form = await Form.findOne({ publicId: req.params.publicId, status: 'published' });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found or not accepting responses' });

    // Check expiry
    if (form.expiresAt && new Date() > form.expiresAt) {
      return res.status(400).json({ success: false, message: 'This form has expired' });
    }

    // Check multiple responses
    if (!form.settings.allowMultipleResponses && req.body.respondentEmail) {
      const existing = await Response.findOne({ form: form._id, respondentEmail: req.body.respondentEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already submitted a response' });
      }
    }

    const { answers, respondentName, respondentEmail, isAnonymous, timeTaken } = req.body;

    // Calculate score for quizzes
    let score = null, totalPoints = null, percentage = null, passed = null;

    const processedAnswers = answers.map(answer => {
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
      respondentName: isAnonymous ? 'Anonymous' : (respondentName || 'Anonymous'),
      respondentEmail: isAnonymous ? null : respondentEmail,
      isAnonymous: isAnonymous || form.settings.allowAnonymous,
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
        correctAnswers: form.settings.showCorrectAnswers ? processedAnswers : null,
        confirmationMessage: form.settings.confirmationMessage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
