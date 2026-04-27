// Returns published forms so public users can answer them.
const Form = require('../models/Form');

// Get public form by publicId (for respondents)
exports.getPublicForm = async (req, res) => {
  try {
    const form = await Form.findOne({ publicId: req.params.publicId, status: 'published' })
      .select('-qrCode -creator');

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found or not available' });
    }

    if (form.expiresAt && new Date() > form.expiresAt) {
      return res.status(400).json({ success: false, message: 'This form has expired' });
    }

    // For quizzes, hide correct answers from respondents
    const formData = form.toObject();
    if (form.type === 'quiz') {
      formData.questions = formData.questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    res.json({ success: true, form: formData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
