// Handles creating, updating, publishing, and managing forms.
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');
const Form = require('../models/Form');
const Response = require('../models/Response');
const { validateFormData } = require('../utils/formValidation');

// Get all forms for logged-in user
exports.getForms = async (req, res) => {
  try {
    const { status, type, search, sort = '-createdAt', page = 1, limit = 100 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
    const query = { creator: req.user._id };

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Form.countDocuments(query);
    const forms = await Form.find(query)
      .sort(sort)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select('-questions');

    res.json({
      success: true,
      forms,
      pagination: { total, page: parsedPage, pages: Math.ceil(total / parsedLimit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single form
exports.getForm = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create form
exports.createForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0]?.msg || 'Invalid form data',
      errors: errors.array(),
    });
  }

  try {
    const validation = validateFormData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.messages[0], errors: validation.messages });
    }

    const form = await Form.create({ ...req.body, creator: req.user._id });
    res.status(201).json({ success: true, message: 'Form created successfully', form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update form
exports.updateForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0]?.msg || 'Invalid form data',
      errors: errors.array(),
    });
  }

  try {
    const form = await Form.findOne({ _id: req.params.id, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const nextFormState = {
      ...form.toObject(),
      ...req.body,
      settings: {
        ...form.settings,
        ...(req.body.settings || {}),
      },
    };
    const validation = validateFormData(nextFormState);

    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.messages[0], errors: validation.messages });
    }

    // Regenerate QR if publishing
    if (req.body.status === 'published' && form.status !== 'published') {
      const publicUrl = `${process.env.FRONTEND_URL}/f/${form.publicId}`;
      req.body.qrCode = await QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' }
      });
    }

    Object.assign(form, req.body);
    await form.save();

    res.json({ success: true, message: 'Form updated successfully', form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete form
exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    await Response.deleteMany({ form: form._id });
    await form.deleteOne();

    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Duplicate form
exports.duplicateForm = async (req, res) => {
  try {
    const original = await Form.findOne({ _id: req.params.id, creator: req.user._id });
    if (!original) return res.status(404).json({ success: false, message: 'Form not found' });

    const { _id, publicId, qrCode, totalResponses, createdAt, updatedAt, ...data } = original.toObject();

    const duplicate = await Form.create({
      ...data,
      title: `${original.title} (Copy)`,
      status: 'draft',
      totalResponses: 0,
      qrCode: null
    });

    res.status(201).json({ success: true, message: 'Form duplicated successfully', form: duplicate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Publish / unpublish form and generate QR
exports.publishForm = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, creator: req.user._id });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const validation = validateFormData(form.toObject());
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.messages[0], errors: validation.messages });
    }

    if (form.status === 'published') {
      form.status = 'draft';
      form.qrCode = null;
    } else {
      form.status = 'published';
      const publicUrl = `${process.env.FRONTEND_URL}/f/${form.publicId}`;
      form.qrCode = await QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' }
      });
    }

    await form.save();
    res.json({ success: true, message: `Form ${form.status === 'published' ? 'published' : 'unpublished'} successfully`, form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userFormIdsPromise = Form.find({ creator: userId }).distinct('_id');
    const [userFormIds, totalForms, publishedForms, draftForms, recentForms, topForms] = await Promise.all([
      userFormIdsPromise,
      Form.countDocuments({ creator: userId }),
      Form.countDocuments({ creator: userId, status: 'published' }),
      Form.countDocuments({ creator: userId, status: 'draft' }),
      Form.find({ creator: userId }).sort('-createdAt').limit(5).select('title type status totalResponses createdAt coverColor'),
      Form.find({ creator: userId }).sort('-totalResponses -createdAt').limit(5).select('title type status totalResponses createdAt coverColor')
    ]);

    const totalResponses = await Response.countDocuments({ form: { $in: userFormIds } });

    // Weekly responses for chart
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weeklyData = await Response.aggregate([
      { $match: { form: { $in: userFormIds }, submittedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: { totalForms, publishedForms, draftForms, totalResponses, recentForms, topForms },
      weeklyData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
