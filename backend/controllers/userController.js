const User = require('../models/User');
const Form = require('../models/Form');
const Response = require('../models/Response');

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { email }, { new: true });
    res.json({ success: true, message: 'Email updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body; // base64 or URL
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    res.json({ success: true, message: 'Avatar updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const forms = await Form.find({ creator: req.user._id }).distinct('_id');
    await Response.deleteMany({ form: { $in: forms } });
    await Form.deleteMany({ creator: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
