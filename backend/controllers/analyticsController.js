const Form = require('../models/Form');
const Response = require('../models/Response');

exports.getFormAnalytics = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const responses = await Response.find({ form: form._id }).sort('-submittedAt');
    const totalResponses = responses.length;

    if (totalResponses === 0) {
      return res.json({ success: true, analytics: { totalResponses: 0, form } });
    }

    // Completion rate (responses with all required questions answered)
    const requiredCount = form.questions.filter(q => q.required).length;

    // Average score for quizzes
    let avgScore = null, avgPercentage = null, passRate = null;
    if (form.type === 'quiz') {
      const scored = responses.filter(r => r.score !== null);
      if (scored.length > 0) {
        avgScore = scored.reduce((s, r) => s + r.score, 0) / scored.length;
        avgPercentage = scored.reduce((s, r) => s + r.percentage, 0) / scored.length;
      }
      if (form.settings.passingScore) {
        const passed = responses.filter(r => r.passed === true).length;
        passRate = Math.round((passed / totalResponses) * 100);
      }
    }

    // Average time taken
    const timed = responses.filter(r => r.timeTaken);
    const avgTime = timed.length > 0 ? Math.round(timed.reduce((s, r) => s + r.timeTaken, 0) / timed.length) : null;

    // Question-wise breakdown
    const questionBreakdown = form.questions.map(question => {
      const questionAnswers = responses
        .map(r => r.answers.find(a => a.questionId === question.id))
        .filter(Boolean);

      let breakdown = {};

      if (['multiple_choice', 'true_false', 'dropdown'].includes(question.type)) {
        const counts = {};
        questionAnswers.forEach(a => {
          const val = String(a.answer);
          counts[val] = (counts[val] || 0) + 1;
        });
        breakdown = { type: 'distribution', data: counts };
      } else if (question.type === 'checkbox') {
        const counts = {};
        questionAnswers.forEach(a => {
          (Array.isArray(a.answer) ? a.answer : [a.answer]).forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
          });
        });
        breakdown = { type: 'distribution', data: counts };
      } else if (question.type === 'rating') {
        const sum = questionAnswers.reduce((s, a) => s + Number(a.answer), 0);
        const avg = questionAnswers.length > 0 ? (sum / questionAnswers.length).toFixed(1) : 0;
        const counts = {};
        for (let i = 1; i <= (question.ratingMax || 5); i++) counts[i] = 0;
        questionAnswers.forEach(a => { counts[Number(a.answer)] = (counts[Number(a.answer)] || 0) + 1; });
        breakdown = { type: 'rating', avg, data: counts };
      } else {
        breakdown = { type: 'text', responses: questionAnswers.slice(0, 20).map(a => a.answer) };
      }

      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        responseCount: questionAnswers.length,
        breakdown,
        ...(form.type === 'quiz' && {
          correctCount: questionAnswers.filter(a => a.isCorrect).length
        })
      };
    });

    // Daily responses (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyResponses = await Response.aggregate([
      { $match: { form: form._id, submittedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Score distribution for quizzes
    let scoreDistribution = null;
    if (form.type === 'quiz') {
      const brackets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      responses.forEach(r => {
        if (r.percentage !== null) {
          if (r.percentage <= 20) brackets['0-20']++;
          else if (r.percentage <= 40) brackets['21-40']++;
          else if (r.percentage <= 60) brackets['41-60']++;
          else if (r.percentage <= 80) brackets['61-80']++;
          else brackets['81-100']++;
        }
      });
      scoreDistribution = brackets;
    }

    res.json({
      success: true,
      analytics: {
        form: { _id: form._id, title: form.title, type: form.type, status: form.status },
        totalResponses,
        avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
        avgPercentage: avgPercentage ? Math.round(avgPercentage) : null,
        passRate,
        avgTime,
        questionBreakdown,
        dailyResponses,
        scoreDistribution,
        recentResponses: responses.slice(0, 10).map(r => ({
          _id: r._id,
          respondentName: r.respondentName,
          score: r.score,
          percentage: r.percentage,
          submittedAt: r.submittedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
