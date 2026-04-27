// Builds analytics data and charts for a single form.
const PDFDocument = require('pdfkit');
const Form = require('../models/Form');
const Response = require('../models/Response');

const formatDate = (value) => new Date(value).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const buildAnalyticsPayload = (form, responses) => {
  const totalResponses = responses.length;

  if (totalResponses === 0) {
    return {
      form: {
        _id: form._id,
        title: form.title,
        type: form.type,
        status: form.status,
        createdAt: form.createdAt,
      },
      totalResponses: 0,
      avgScore: null,
      avgPercentage: null,
      passRate: null,
      passFailCounts: null,
      avgTime: null,
      questionBreakdown: [],
      topSelections: [],
      dailyResponses: [],
      scoreDistribution: null,
      recentResponses: [],
    };
  }

  // Average score for quizzes
  let avgScore = null, avgPercentage = null, passRate = null, passFailCounts = null;
  if (form.type === 'quiz') {
    const scored = responses.filter(r => r.score !== null);
    if (scored.length > 0) {
      avgScore = scored.reduce((s, r) => s + r.score, 0) / scored.length;
      avgPercentage = scored.reduce((s, r) => s + r.percentage, 0) / scored.length;
    }
    const passed = responses.filter(r => r.passed === true).length;
    const failed = responses.filter(r => r.passed === false).length;
    passFailCounts = { passed, failed };
    if (form.settings.passingScore) {
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
    let topAnswer = null;
    let insight = '';

    if (['multiple_choice', 'true_false', 'dropdown'].includes(question.type)) {
      const counts = {};
      questionAnswers.forEach(a => {
        const val = String(a.answer);
        counts[val] = (counts[val] || 0) + 1;
      });
      breakdown = { type: 'distribution', data: counts };
      const [topValue, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
      if (topValue) {
        topAnswer = {
          answer: topValue,
          count: topCount,
          percentage: Math.round((topCount / questionAnswers.length) * 100)
        };
        insight = `${topValue} is the most selected answer at ${topAnswer.percentage}%`;
      }
    } else if (question.type === 'checkbox') {
      const counts = {};
      questionAnswers.forEach(a => {
        (Array.isArray(a.answer) ? a.answer : [a.answer]).forEach(v => {
          counts[v] = (counts[v] || 0) + 1;
        });
      });
      breakdown = { type: 'distribution', data: counts };
      const [topValue, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
      if (topValue) {
        topAnswer = {
          answer: topValue,
          count: topCount,
          percentage: Math.round((topCount / questionAnswers.length) * 100)
        };
        insight = `${topValue} appears most often across submissions`;
      }
    } else if (question.type === 'rating') {
      const sum = questionAnswers.reduce((s, a) => s + Number(a.answer), 0);
      const avg = questionAnswers.length > 0 ? (sum / questionAnswers.length).toFixed(1) : 0;
      const counts = {};
      for (let i = 1; i <= (question.ratingMax || 5); i++) counts[i] = 0;
      questionAnswers.forEach(a => { counts[Number(a.answer)] = (counts[Number(a.answer)] || 0) + 1; });
      breakdown = { type: 'rating', avg, data: counts };
      insight = `Average rating is ${avg} out of ${question.ratingMax || 5}`;
    } else {
      breakdown = { type: 'text', responses: questionAnswers.slice(0, 20).map(a => a.answer) };
      insight = `${questionAnswers.length} text response${questionAnswers.length === 1 ? '' : 's'} collected`;
    }

    return {
      questionId: question.id,
      question: question.question,
      type: question.type,
      responseCount: questionAnswers.length,
      responseRate: totalResponses > 0 ? Math.round((questionAnswers.length / totalResponses) * 100) : 0,
      breakdown,
      topAnswer,
      insight,
      ...(form.type === 'quiz' && {
        correctCount: questionAnswers.filter(a => a.isCorrect).length
      })
    };
  });

  const topSelections = questionBreakdown
    .filter(qb => qb.topAnswer)
    .map(qb => ({
      questionId: qb.questionId,
      question: qb.question,
      answer: qb.topAnswer.answer,
      count: qb.topAnswer.count,
      percentage: qb.topAnswer.percentage
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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

  return {
    form: { _id: form._id, title: form.title, type: form.type, status: form.status, createdAt: form.createdAt },
    totalResponses,
    avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
    avgPercentage: avgPercentage ? Math.round(avgPercentage) : null,
    passRate,
    passFailCounts,
    avgTime,
    questionBreakdown,
    topSelections,
    scoreDistribution,
    recentResponses: responses.slice(0, 10).map(r => ({
      _id: r._id,
      respondentName: r.respondentName,
      score: r.score,
      percentage: r.percentage,
      submittedAt: r.submittedAt
    }))
  };
};

const addSectionTitle = (doc, title) => {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text(title);
  doc.moveDown(0.3);
  doc.fillColor('#1f2937');
};

const addDivider = (doc) => {
  const y = doc.y + 6;
  doc.moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor('#e5e7eb')
    .stroke();
  doc.moveDown(0.8);
  doc.strokeColor('#000000');
};

const writeWrappedBullet = (doc, text) => {
  doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`• ${text}`, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
  });
};

exports.getFormAnalytics = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const responses = await Response.find({ form: form._id }).sort('-submittedAt');
    const analytics = buildAnalyticsPayload(form, responses);

    // Daily responses (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    analytics.dailyResponses = await Response.aggregate([
      { $match: { form: form._id, submittedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportAnalyticsPdf = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const responses = await Response.find({ form: form._id }).sort('-submittedAt');
    const analytics = buildAnalyticsPayload(form, responses);

    const safeTitle = form.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'analytics-report';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}-analytics-report.pdf"`);

    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#111827').text('QuiznSurvey Analytics Report');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(18).text(form.title);
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(`Form type: ${form.type}`);
    doc.text(`Status: ${form.status}`);
    doc.text(`Created: ${formatDate(form.createdAt)}`);
    doc.text(`Exported: ${formatDate(new Date())}`);

    addDivider(doc);

    addSectionTitle(doc, 'Overview');
    doc.font('Helvetica').fontSize(11).fillColor('#1f2937');
    doc.text(`Total responses: ${analytics.totalResponses}`);
    if (analytics.avgTime) {
      doc.text(`Average completion time: ${Math.floor(analytics.avgTime / 60)}m ${analytics.avgTime % 60}s`);
    }

    if (form.type === 'quiz') {
      addSectionTitle(doc, 'Quiz Performance');
      if (analytics.avgPercentage !== null) {
        doc.text(`Average score: ${analytics.avgPercentage}%`);
      }
      if (analytics.avgScore !== null) {
        doc.text(`Average points earned: ${analytics.avgScore}`);
      }
      if (analytics.passRate !== null) {
        doc.text(`Pass rate: ${analytics.passRate}%`);
      }
      if (analytics.passFailCounts) {
        doc.text(`Passed: ${analytics.passFailCounts.passed}`);
        doc.text(`Failed: ${analytics.passFailCounts.failed}`);
      }
    }

    addSectionTitle(doc, 'Most Selected Answers');
    if (analytics.topSelections.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('No multiple-choice style answer trends are available yet.');
    } else {
      analytics.topSelections.forEach((selection, index) => {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(`${index + 1}. ${selection.question}`);
        doc.font('Helvetica').fontSize(10).fillColor('#374151').text(
          `${selection.answer} — selected ${selection.count} time${selection.count === 1 ? '' : 's'} (${selection.percentage}%)`
        );
        doc.moveDown(0.4);
      });
    }

    addSectionTitle(doc, 'Question-Level Insights');
    if (analytics.questionBreakdown.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('No question insights available yet.');
    } else {
      analytics.questionBreakdown.forEach((question, index) => {
        if (doc.y > 700) doc.addPage();
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(`${index + 1}. ${question.question}`);
        doc.font('Helvetica').fontSize(10).fillColor('#374151').text(
          `Type: ${question.type} | Responses: ${question.responseCount} | Response rate: ${question.responseRate}%`
        );
        if (form.type === 'quiz' && question.correctCount !== undefined) {
          const correctness = question.responseCount > 0 ? Math.round((question.correctCount / question.responseCount) * 100) : 0;
          doc.text(`Correct response rate: ${correctness}%`);
        }
        if (question.insight) {
          writeWrappedBullet(doc, question.insight);
        }
        if (question.topAnswer?.answer) {
          writeWrappedBullet(doc, `Top answer: ${question.topAnswer.answer} (${question.topAnswer.percentage}%)`);
        }
        if (question.breakdown.type === 'rating') {
          writeWrappedBullet(doc, `Average rating: ${question.breakdown.avg}`);
        }
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
