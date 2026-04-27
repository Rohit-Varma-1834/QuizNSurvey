// Generates draft quiz or survey questions with the OpenAI API.
const Form = require('../models/Form');
const Response = require('../models/Response');

const QUIZ_FORM_TYPES = new Set(['quiz']);
const SURVEY_QUESTION_TYPES = new Set(['multiple_choice', 'short_answer', 'paragraph', 'rating']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const trimText = (value, maxLength = 500) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const uniqueStrings = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => trimText(value, 120))
    .filter((value) => {
      if (!value || seen.has(value.toLowerCase())) return false;
      seen.add(value.toLowerCase());
      return true;
    });
};

const buildQuestionSchema = (formType) => {
  if (formType === 'quiz') {
    return {
      name: 'quiz_question_set',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['questions'],
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['type', 'question', 'description', 'required', 'options', 'correctAnswer', 'points'],
              properties: {
                type: { type: 'string', enum: ['multiple_choice'] },
                question: { type: 'string' },
                description: { type: 'string' },
                required: { type: 'boolean' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                },
                correctAnswer: { type: 'string' },
                points: { type: 'integer' },
              },
            },
          },
        },
      },
    };
  }

  return {
    name: 'survey_question_set',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['questions'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'question', 'description', 'required', 'options', 'ratingMax'],
            properties: {
              type: { type: 'string', enum: ['multiple_choice', 'short_answer', 'paragraph', 'rating'] },
              question: { type: 'string' },
              description: { type: 'string' },
              required: { type: 'boolean' },
              options: {
                type: 'array',
                items: { type: 'string' },
              },
              ratingMax: { type: 'integer' },
            },
          },
        },
      },
    },
  };
};

const buildPrompt = ({ topic, audience, goal, formType, questionCount, difficulty }) => {
  const lines = [
    `Topic: ${topic}`,
    `Audience: ${audience || 'General audience'}`,
    `Goal: ${goal || 'Create helpful questions for the topic'}`,
    `Form type: ${formType}`,
    `Question count: ${questionCount}`,
    `Difficulty: ${difficulty}`,
  ];

  if (formType === 'quiz') {
    lines.push(
      'Create exactly the requested number of quiz questions.',
      'Every question must be multiple_choice.',
      'Each question must include 4 concise options.',
      'Each question must have exactly one correctAnswer that matches one of the options exactly.',
      'Use points between 1 and 5.',
      'Keep wording clear and classroom-friendly.'
    );
  } else {
    lines.push(
      'Create exactly the requested number of survey questions.',
      'Use a thoughtful mix of multiple_choice, short_answer, paragraph, and rating when appropriate.',
      'Use multiple_choice only when options are genuinely useful.',
      'For non-multiple_choice questions, return an empty options array.',
      'For rating questions, use a ratingMax between 3 and 10.',
      'Keep the questions practical and useful for collecting feedback or opinions.'
    );
  }

  return lines.join('\n');
};

const extractOutputText = (payload) => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  return '';
};

const answerToText = (answer) => {
  if (Array.isArray(answer)) return answer.map((value) => String(value)).join(', ');
  if (answer === null || answer === undefined) return '';
  return String(answer);
};

const buildSummarySchema = () => ({
  name: 'response_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['overallSummary', 'keyTrends', 'positiveFeedback', 'negativeFeedback', 'suggestedActions'],
    properties: {
      overallSummary: { type: 'string' },
      keyTrends: {
        type: 'array',
        items: { type: 'string' },
      },
      positiveFeedback: {
        type: 'array',
        items: { type: 'string' },
      },
      negativeFeedback: {
        type: 'array',
        items: { type: 'string' },
      },
      suggestedActions: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
});

const buildSentimentSchema = () => ({
  name: 'survey_sentiment',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['positiveCount', 'neutralCount', 'negativeCount', 'explanation'],
    properties: {
      positiveCount: { type: 'integer' },
      neutralCount: { type: 'integer' },
      negativeCount: { type: 'integer' },
      explanation: { type: 'string' },
    },
  },
});

const trimList = (items, maxItems = 5) => (
  Array.isArray(items)
    ? items
      .map((item) => trimText(item, 220))
      .filter(Boolean)
      .slice(0, maxItems)
    : []
);

const normalizeSummaryOutput = (summary) => {
  const overallSummary = trimText(summary?.overallSummary, 500);

  if (!overallSummary) {
    throw new Error('AI summary did not include an overall summary');
  }

  return {
    overallSummary,
    keyTrends: trimList(summary?.keyTrends),
    positiveFeedback: trimList(summary?.positiveFeedback),
    negativeFeedback: trimList(summary?.negativeFeedback),
    suggestedActions: trimList(summary?.suggestedActions),
  };
};

const summarizeQuestionResponses = (question, responses) => {
  const questionAnswers = responses
    .map((response) => response.answers.find((answer) => answer.questionId === question.id))
    .filter(Boolean);

  if (['multiple_choice', 'true_false', 'dropdown'].includes(question.type)) {
    const counts = {};
    questionAnswers.forEach((answer) => {
      const value = answerToText(answer.answer);
      if (!value) return;
      counts[value] = (counts[value] || 0) + 1;
    });

    return {
      question: question.question,
      type: question.type,
      responseCount: questionAnswers.length,
      topAnswers: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([answer, count]) => ({ answer, count })),
    };
  }

  if (question.type === 'checkbox') {
    const counts = {};
    questionAnswers.forEach((answer) => {
      const values = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
      values.forEach((value) => {
        const normalized = trimText(value, 120);
        if (!normalized) return;
        counts[normalized] = (counts[normalized] || 0) + 1;
      });
    });

    return {
      question: question.question,
      type: question.type,
      responseCount: questionAnswers.length,
      topAnswers: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([answer, count]) => ({ answer, count })),
    };
  }

  if (question.type === 'rating') {
    const ratings = questionAnswers
      .map((answer) => Number(answer.answer))
      .filter((value) => Number.isFinite(value));
    const counts = {};

    ratings.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });

    const average = ratings.length
      ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
      : null;

    return {
      question: question.question,
      type: question.type,
      responseCount: questionAnswers.length,
      average,
      distribution: Object.entries(counts)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([rating, count]) => ({ rating: Number(rating), count })),
    };
  }

  const sampleResponses = questionAnswers
    .map((answer) => trimText(answerToText(answer.answer), 240))
    .filter(Boolean)
    .slice(0, 12);

  return {
    question: question.question,
    type: question.type,
    responseCount: questionAnswers.length,
    sampleResponses,
  };
};

const buildResponseSummaryInput = (form, responses) => {
  const base = {
    formTitle: form.title,
    formType: form.type,
    totalResponses: responses.length,
    questionSummaries: form.questions.map((question) => summarizeQuestionResponses(question, responses)),
  };

  if (form.type === 'quiz') {
    const scoredResponses = responses.filter((response) => response.percentage !== null);
    const averagePercentage = scoredResponses.length
      ? Math.round(scoredResponses.reduce((sum, response) => sum + response.percentage, 0) / scoredResponses.length)
      : null;
    const passRate = typeof form.settings?.passingScore === 'number' && responses.length
      ? Math.round((responses.filter((response) => response.passed === true).length / responses.length) * 100)
      : null;

    base.quizMetrics = {
      averagePercentage,
      passRate,
      passingScore: form.settings?.passingScore ?? null,
    };
  }

  return base;
};

const getSurveyTextEntries = (form, responses) => {
  const textQuestionIds = new Set(
    form.questions
      .filter((question) => ['short_answer', 'paragraph'].includes(question.type))
      .map((question) => question.id)
  );

  return responses.flatMap((response) => (
    response.answers
      .filter((answer) => textQuestionIds.has(answer.questionId))
      .map((answer) => ({
        question: trimText(answer.questionText, 220),
        answer: trimText(answerToText(answer.answer), 320),
      }))
      .filter((entry) => entry.answer)
  ));
};

const normalizeSentimentOutput = (sentiment) => {
  const positiveCount = Math.max(0, Math.round(Number(sentiment?.positiveCount) || 0));
  const neutralCount = Math.max(0, Math.round(Number(sentiment?.neutralCount) || 0));
  const negativeCount = Math.max(0, Math.round(Number(sentiment?.negativeCount) || 0));
  const explanation = trimText(sentiment?.explanation, 320);
  const total = positiveCount + neutralCount + negativeCount;

  if (!total) {
    throw new Error('AI sentiment analysis did not classify any responses');
  }

  return {
    positiveCount,
    neutralCount,
    negativeCount,
    positivePercentage: Math.round((positiveCount / total) * 100),
    neutralPercentage: Math.round((neutralCount / total) * 100),
    negativePercentage: Math.round((negativeCount / total) * 100),
    explanation: explanation || 'Sentiment analysis completed.',
  };
};

const normalizeQuizQuestion = (question, index) => {
  const questionText = trimText(question.question);
  const description = trimText(question.description, 300);
  const options = uniqueStrings(question.options);
  const correctAnswer = trimText(question.correctAnswer, 120);
  const points = Number.isFinite(Number(question.points))
    ? Math.max(1, Math.min(5, Math.round(Number(question.points))))
    : 1;

  if (!questionText) {
    throw new Error(`AI returned an empty quiz question at position ${index + 1}`);
  }

  if (options.length < 2) {
    throw new Error(`AI returned too few options for quiz question ${index + 1}`);
  }

  if (!correctAnswer || !options.includes(correctAnswer)) {
    throw new Error(`AI returned an invalid correct answer for quiz question ${index + 1}`);
  }

  return {
    type: 'multiple_choice',
    question: questionText,
    description,
    required: question.required !== false,
    options,
    correctAnswer,
    points,
    ratingMax: 5,
  };
};

const normalizeSurveyQuestion = (question, index) => {
  const type = trimText(question.type, 40);
  const questionText = trimText(question.question);
  const description = trimText(question.description, 300);
  const options = uniqueStrings(question.options);
  const ratingMax = Number.isFinite(Number(question.ratingMax))
    ? Math.max(3, Math.min(10, Math.round(Number(question.ratingMax))))
    : 5;

  if (!SURVEY_QUESTION_TYPES.has(type)) {
    throw new Error(`AI returned an unsupported survey question type at position ${index + 1}`);
  }

  if (!questionText) {
    throw new Error(`AI returned an empty survey question at position ${index + 1}`);
  }

  if (type === 'multiple_choice' && options.length < 2) {
    throw new Error(`AI returned too few options for survey question ${index + 1}`);
  }

  return {
    type,
    question: questionText,
    description,
    required: question.required !== false,
    options: type === 'multiple_choice' ? options : [],
    correctAnswer: null,
    points: 1,
    ratingMax: type === 'rating' ? ratingMax : 5,
  };
};

const validateAndNormalizeQuestions = (formType, questions, questionCount) => {
  if (!Array.isArray(questions) || questions.length !== questionCount) {
    throw new Error(`AI must return exactly ${questionCount} question${questionCount === 1 ? '' : 's'}`);
  }

  return questions.map((question, index) => (
    formType === 'quiz'
      ? normalizeQuizQuestion(question, index)
      : normalizeSurveyQuestion(question, index)
  ));
};

exports.generateQuestions = async (req, res) => {
  const topic = trimText(req.body.topic, 200);
  const audience = trimText(req.body.audience, 200);
  const goal = trimText(req.body.goal, 300);
  const formType = trimText(req.body.formType, 20);
  const difficulty = trimText(req.body.difficulty, 20).toLowerCase();
  const questionCount = Number.parseInt(req.body.questionCount, 10);

  if (!topic) {
    return res.status(400).json({ success: false, message: 'Topic is required' });
  }

  if (!QUIZ_FORM_TYPES.has(formType) && formType !== 'survey') {
    return res.status(400).json({ success: false, message: 'Form type must be quiz or survey' });
  }

  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 15) {
    return res.status(400).json({ success: false, message: 'Question count must be between 1 and 15' });
  }

  if (!DIFFICULTIES.has(difficulty)) {
    return res.status(400).json({ success: false, message: 'Difficulty must be easy, medium, or hard' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, message: 'OpenAI API key is not configured on the server' });
  }

  try {
    const openAiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You generate clean JSON question drafts for a form builder. Return only schema-compliant JSON.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: buildPrompt({ topic, audience, goal, formType, questionCount, difficulty }),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            ...buildQuestionSchema(formType),
          },
        },
      }),
    });

    const responsePayload = await openAiResponse.json();

    if (!openAiResponse.ok) {
      const errorMessage = responsePayload?.error?.message || 'OpenAI request failed';
      return res.status(502).json({ success: false, message: errorMessage });
    }

    const outputText = extractOutputText(responsePayload);
    if (!outputText) {
      return res.status(502).json({ success: false, message: 'AI did not return any question data' });
    }

    const parsedOutput = JSON.parse(outputText);
    const questions = validateAndNormalizeQuestions(formType, parsedOutput.questions, questionCount);

    return res.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('AI question generation error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI questions',
    });
  }
};

exports.summarizeResponses = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, message: 'OpenAI API key is not configured on the server' });
  }

  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    const responses = await Response.find({ form: form._id }).sort('-submittedAt');
    if (responses.length === 0) {
      return res.status(400).json({ success: false, message: 'This form has no responses to summarize yet' });
    }

    const summaryInput = buildResponseSummaryInput(form, responses);

    const openAiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You summarize collected form responses for creators. Keep the output concise, practical, and based only on the provided aggregated response data. Do not mention missing personal information.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Summarize the following response dataset as JSON.\n${JSON.stringify(summaryInput)}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            ...buildSummarySchema(),
          },
        },
      }),
    });

    const responsePayload = await openAiResponse.json();

    if (!openAiResponse.ok) {
      const errorMessage = responsePayload?.error?.message || 'OpenAI request failed';
      return res.status(502).json({ success: false, message: errorMessage });
    }

    const outputText = extractOutputText(responsePayload);
    if (!outputText) {
      return res.status(502).json({ success: false, message: 'AI did not return a response summary' });
    }

    const parsedOutput = JSON.parse(outputText);
    const summary = normalizeSummaryOutput(parsedOutput);

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('AI response summary error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to summarize responses',
    });
  }
};

exports.analyzeSentiment = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, message: 'OpenAI API key is not configured on the server' });
  }

  try {
    const form = await Form.findOne({ _id: req.params.formId, creator: req.user._id });
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    if (form.type !== 'survey') {
      return res.status(400).json({ success: false, message: 'Sentiment analysis is available for surveys only' });
    }

    const responses = await Response.find({ form: form._id }).sort('-submittedAt');
    const textEntries = getSurveyTextEntries(form, responses);

    if (!textEntries.length) {
      return res.status(400).json({ success: false, message: 'This survey has no text responses to analyze yet' });
    }

    const openAiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You analyze survey text feedback sentiment. Classify each response as positive, neutral, or negative based only on the provided text. Return concise JSON only.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Analyze the sentiment of these survey text responses. The counts must sum to ${textEntries.length}.\n${JSON.stringify(textEntries)}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            ...buildSentimentSchema(),
          },
        },
      }),
    });

    const responsePayload = await openAiResponse.json();

    if (!openAiResponse.ok) {
      const errorMessage = responsePayload?.error?.message || 'OpenAI request failed';
      return res.status(502).json({ success: false, message: errorMessage });
    }

    const outputText = extractOutputText(responsePayload);
    if (!outputText) {
      return res.status(502).json({ success: false, message: 'AI did not return sentiment analysis' });
    }

    const parsedOutput = JSON.parse(outputText);
    const sentiment = normalizeSentimentOutput(parsedOutput);

    return res.json({
      success: true,
      sentiment: {
        ...sentiment,
        analyzedResponseCount: sentiment.positiveCount + sentiment.neutralCount + sentiment.negativeCount,
      },
    });
  } catch (error) {
    console.error('AI sentiment analysis error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze survey sentiment',
    });
  }
};
