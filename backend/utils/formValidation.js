const QUESTION_TYPES_WITH_OPTIONS = new Set(['multiple_choice', 'checkbox', 'dropdown']);
const QUIZ_TYPES_WITH_CORRECT_ANSWER = new Set(['multiple_choice', 'checkbox', 'dropdown', 'true_false']);
const SUPPORTED_QUESTION_TYPES = new Set(['multiple_choice', 'checkbox', 'short_answer', 'paragraph', 'true_false', 'rating', 'dropdown']);

const trimText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeOptions = (options) => (
  Array.isArray(options)
    ? options.map((option) => trimText(option))
    : []
);

const questionLabel = (index) => `Question ${index + 1}`;

function validateFormData(formData = {}, { requireQuestions = true } = {}) {
  const messages = [];
  const title = trimText(formData.title);
  const questions = Array.isArray(formData.questions) ? formData.questions : [];
  const formType = formData.type;

  if (!title) {
    messages.push('Form title is required.');
  }

  if (requireQuestions && questions.length === 0) {
    messages.push('Add at least one question before saving this form.');
  }

  questions.forEach((question = {}, index) => {
    const label = questionLabel(index);
    const questionText = trimText(question.question);
    const options = normalizeOptions(question.options);
    const hasEmptyOptions = options.some((option) => !option);
    const validOptions = options.filter(Boolean);
    const ratingMax = Number(question.ratingMax);

    if (!SUPPORTED_QUESTION_TYPES.has(question.type)) {
      messages.push(`${label} uses an unsupported question type.`);
      return;
    }

    if (!questionText) {
      messages.push(`${label} must include question text.`);
    }

    if (QUESTION_TYPES_WITH_OPTIONS.has(question.type)) {
      if (hasEmptyOptions) {
        messages.push(`${label} has an empty option. Remove blank options before saving.`);
      }

      if (validOptions.length < 2) {
        messages.push(`${label} must include at least two options.`);
      }
    }

    if (question.type === 'rating') {
      if (!Number.isInteger(ratingMax) || ratingMax < 3 || ratingMax > 10) {
        messages.push(`${label} must use a rating scale between 3 and 10.`);
      }
    }

    if (formType === 'quiz' && QUIZ_TYPES_WITH_CORRECT_ANSWER.has(question.type)) {
      if (question.type === 'checkbox') {
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.map((answer) => trimText(answer)).filter(Boolean)
          : [];

        if (!correctAnswers.length) {
          messages.push(`${label} must include at least one correct answer.`);
        } else if (correctAnswers.some((answer) => !validOptions.includes(answer))) {
          messages.push(`${label} has a correct answer that does not match its options.`);
        }
      } else {
        const correctAnswer = trimText(question.correctAnswer);
        const allowedAnswers = question.type === 'true_false'
          ? ['True', 'False']
          : validOptions;

        if (!correctAnswer) {
          messages.push(`${label} must include a correct answer.`);
        } else if (!allowedAnswers.includes(correctAnswer)) {
          messages.push(`${label} has a correct answer that does not match its options.`);
        }
      }
    }
  });

  return {
    isValid: messages.length === 0,
    messages,
  };
}

module.exports = {
  validateFormData,
};
