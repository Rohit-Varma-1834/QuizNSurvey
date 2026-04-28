// Lets users create and edit quiz and survey forms.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import QuestionEditor from '../components/forms/QuestionEditor';
import { DateInput, PageLoader } from '../components/ui/Common';
import {
  HiOutlineSave, HiOutlineGlobe, HiOutlineArrowLeft, HiOutlinePlus,
} from 'react-icons/hi';

const COVER_COLORS = ['#0000FF', '#00FF00', '#00C8A7', '#6C63FF', '#FF6B6B', '#FF9F1C', '#0F172A', '#F43F5E'];
const QUESTION_TYPES_WITH_OPTIONS = new Set(['multiple_choice', 'checkbox', 'dropdown']);
const QUIZ_TYPES_WITH_CORRECT_ANSWER = new Set(['multiple_choice', 'checkbox', 'dropdown', 'true_false']);

const newQuestion = (type = 'multiple_choice') => ({
  id: uuidv4(), type,
  question: '', description: '', required: false,
  options: type === 'true_false' ? ['True','False'] : ['multiple_choice','checkbox','dropdown'].includes(type) ? ['Option 1','Option 2'] : [],
  correctAnswer: null, points: 1, ratingMax: 5, order: 0,
});

const defaultAiDraft = (type) => ({
  aiPrompt: type === 'quiz'
    ? 'Create 5 easy Java OOP quiz questions for college beginners.'
    : 'Generate a customer feedback survey for a restaurant with rating and short-answer questions.',
});

const normalizeGeneratedQuestion = (question, formType, order) => {
  const questionType = formType === 'quiz' ? 'multiple_choice' : (question.type || 'short_answer');
  const base = newQuestion(questionType);
  const options = Array.isArray(question.options)
    ? question.options.map((option) => String(option).trim()).filter(Boolean)
    : [];

  return {
    ...base,
    ...question,
    id: uuidv4(),
    order,
    type: questionType,
    question: String(question.questionText || question.question || question.text || '').trim(),
    description: String(question.description || '').trim(),
    required: question.required !== false,
    options: questionType === 'true_false'
      ? ['True', 'False']
      : ['multiple_choice', 'checkbox', 'dropdown'].includes(questionType)
        ? (options.length ? options : base.options)
        : [],
    correctAnswer: formType === 'quiz' ? question.correctAnswer ?? null : null,
    points: formType === 'quiz' ? Math.max(1, Number(question.points) || 1) : 1,
    ratingMax: questionType === 'rating' ? Math.max(3, Number(question.ratingMax) || 5) : 5,
  };
};

const trimText = (value) => (typeof value === 'string' ? value.trim() : '');

const validateFormDraft = (form, formType) => {
  const nextErrors = {};
  const messages = [];

  if (!trimText(form.title)) {
    nextErrors.title = 'Title is required';
    messages.push('Add a title before saving this form.');
  }

  if (!Array.isArray(form.questions) || form.questions.length === 0) {
    nextErrors.questions = 'Add at least one question';
    messages.push('Add at least one question before saving this form.');
  }

  (form.questions || []).forEach((question, index) => {
    const label = `Question ${index + 1}`;
    const questionMessages = [];
    const options = Array.isArray(question.options) ? question.options.map((option) => trimText(option)) : [];
    const validOptions = options.filter(Boolean);
    const hasEmptyOptions = options.some((option) => !option);
    const ratingMax = Number(question.ratingMax);

    if (!trimText(question.question)) {
      questionMessages.push(`${label} needs question text.`);
    }

    if (QUESTION_TYPES_WITH_OPTIONS.has(question.type)) {
      if (hasEmptyOptions) {
        questionMessages.push(`${label} has an empty option. Remove blank options before saving.`);
      } else if (validOptions.length < 2) {
        questionMessages.push(`${label} needs at least two options.`);
      }
    }

    if (question.type === 'rating' && (!Number.isInteger(ratingMax) || ratingMax < 3 || ratingMax > 10)) {
      questionMessages.push(`${label} must use a rating scale between 3 and 10.`);
    }

    if (formType === 'quiz' && QUIZ_TYPES_WITH_CORRECT_ANSWER.has(question.type)) {
      if (question.type === 'checkbox') {
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.map((answer) => trimText(answer)).filter(Boolean)
          : [];

        if (!correctAnswers.length) {
          questionMessages.push(`${label} needs at least one correct answer.`);
        } else if (correctAnswers.some((answer) => !validOptions.includes(answer))) {
          questionMessages.push(`${label} has a correct answer that does not match its options.`);
        }
      } else {
        const correctAnswer = trimText(question.correctAnswer);
        const allowedAnswers = question.type === 'true_false' ? ['True', 'False'] : validOptions;

        if (!correctAnswer) {
          questionMessages.push(`${label} needs a correct answer.`);
        } else if (!allowedAnswers.includes(correctAnswer)) {
          questionMessages.push(`${label} has a correct answer that does not match its options.`);
        }
      }
    }

    if (questionMessages.length) {
      nextErrors[`q_${index}`] = questionMessages[0];
      if (!nextErrors.questions) {
        nextErrors.questions = 'Fix the highlighted questions before saving.';
      }
      messages.push(questionMessages[0]);
    }
  });

  return {
    isValid: Object.keys(nextErrors).length === 0,
    errors: nextErrors,
    firstMessage: messages[0] || 'Please fix the highlighted errors.',
  };
};

// ── TYPE SELECTOR ─────────────────────────────────────────────────────────────
function TypeSelector({ onSelect }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', minHeight: 'calc(100vh - 60px)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>What do you want to create?</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 52, textAlign: 'center', fontSize: 16 }}>Choose the type that fits your goal</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, maxWidth: 720, width: '100%' }}>

          {/* QUIZ */}
          <button onClick={() => onSelect('quiz')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: 22, padding: '36px 28px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.22s', outline: 'none' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(var(--primary-rgb),0.18)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>Quiz</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: 'var(--primary)' }}>Quiz</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              Test knowledge with right/wrong answers. Auto-grade responses, set timers, define passing scores, and show results instantly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['Auto-grading and instant scoring','Time limit per quiz','Pass or fail threshold','Detailed score analytics'].map(f => (
                <span key={f} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
              ))}
            </div>
            <div style={{ marginTop: 24, background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
              Create Quiz
            </div>
          </button>

          {/* SURVEY */}
          <button onClick={() => onSelect('survey')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: 22, padding: '36px 28px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.22s', outline: 'none' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(var(--secondary-rgb),0.18)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>Survey</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: 'var(--secondary-dark)' }}>Survey</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              Collect opinions, feedback, and data. No right or wrong answers. Perfect for research, feedback forms, polls, and event check-ins.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['Optional anonymous responses','Auto-close on expiry date','Open-ended text questions','Response trend analytics'].map(f => (
                <span key={f} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
              ))}
            </div>
            <div style={{ marginTop: 24, background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
              Create Survey
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SHARED BUILDER SHELL ──────────────────────────────────────────────────────
function BuilderShell({ type, form, setForm, formId, onSaved, questionTypes }) {
  const navigate = useNavigate();
  const isEdit = Boolean(formId);
  const isQuiz = type === 'quiz';
  const label = isQuiz ? 'Quiz' : 'Survey';
  const aiPromptExample = isQuiz
    ? 'Create 10 medium multiple-choice quiz questions about Indian geography for 8th grade students.'
    : 'Generate a customer feedback survey for a restaurant with rating and short-answer questions.';

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiDraft, setAiDraft] = useState(() => defaultAiDraft(type));
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setAiDraft(defaultAiDraft(type));
  }, [type]);

  const validate = () => {
    const result = validateFormDraft(form, type);
    setErrors(result.errors);
    return result;
  };

  const clearQuestionErrors = (questionKeys = []) => {
    setErrors((current) => {
      const next = { ...current };
      delete next.questions;
      if (questionKeys.length) {
        questionKeys.forEach((key) => delete next[key]);
      } else {
        Object.keys(next).forEach((key) => {
          if (key.startsWith('q_')) delete next[key];
        });
      }
      return next;
    });
  };

  const buildPayload = () => ({
    ...form, type,
    tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    expiresAt: form.expiresAt || null,
    settings: {
      ...form.settings,
      timeLimit: form.settings.timeLimit ? Number(form.settings.timeLimit) : null,
      passingScore: form.settings.passingScore ? Number(form.settings.passingScore) : null,
    },
  });

  const handleSave = async () => {
    const validation = validate();
    if (!validation.isValid) { toast.error(validation.firstMessage); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/forms/${formId}`, buildPayload());
        toast.success(`${isQuiz ? 'Quiz' : 'Survey'} saved!`);
      } else {
        const { data } = await api.post('/api/forms', buildPayload());
        toast.success(`${isQuiz ? 'Quiz' : 'Survey'} created!`);
        onSaved(data.form._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!isEdit) { toast.error('Save first'); return; }
    const validation = validate();
    if (!validation.isValid) { toast.error(validation.firstMessage); return; }
    setPublishing(true);
    try {
      const { data } = await api.post(`/api/forms/${formId}/publish`);
      toast.success(data.message);
      setForm(f => ({ ...f, status: data.form.status }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setPublishing(false);
    }
  };

  const addQ = (qType) => {
    clearQuestionErrors();
    setForm(f => {
      const q = newQuestion(qType);
      q.order = f.questions.length;
      return { ...f, questions: [...f.questions, q] };
    });
  };
  const updateQ = (i, u) => {
    clearQuestionErrors([`q_${i}`]);
    setForm(f => {
      const qs = [...f.questions];
      qs[i] = u;
      return { ...f, questions: qs };
    });
  };
  const deleteQ = (i) => {
    clearQuestionErrors();
    setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  };
  const dupQ = (i) => {
    clearQuestionErrors();
    setForm(f => {
      const qs = [...f.questions];
      qs.splice(i + 1, 0, { ...qs[i], id: uuidv4() });
      return { ...f, questions: qs };
    });
  };
  const moveQ = (i, dir) => {
    clearQuestionErrors();
    setForm(f => {
      const qs = [...f.questions];
      const to = i + dir;
      if (to < 0 || to >= qs.length) return f;
      [qs[i], qs[to]] = [qs[to], qs[i]];
      return { ...f, questions: qs };
    });
  };

  const handleGenerateQuestions = async () => {
    if (!aiDraft.aiPrompt.trim()) {
      toast.error('AI prompt is required');
      return;
    }

    setAiLoading(true);
    try {
      const payload = {
        aiPrompt: aiDraft.aiPrompt,
        formType: type,
      };

      const { data } = await api.post('/api/ai/generate-questions', payload);
      const generatedQuestions = Array.isArray(data.questions) ? data.questions : [];

      if (!generatedQuestions.length) {
        toast.error('AI did not return any questions');
        return;
      }

      setForm((currentForm) => {
        const startOrder = currentForm.questions.length;
        const normalizedQuestions = generatedQuestions.map((question, index) => (
          normalizeGeneratedQuestion(question, type, startOrder + index)
        ));

        return {
          ...currentForm,
          questions: [...currentForm.questions, ...normalizedQuestions],
        };
      });

      setErrors((current) => ({ ...current, questions: '' }));
      toast.success(`${generatedQuestions.length} question${generatedQuestions.length === 1 ? '' : 's'} added. Review them before saving.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setAiLoading(false);
    }
  };

  const totalPoints = form.questions.reduce((s, q) => s + (q.points || 1), 0);
  const summaryItems = [
    { label: 'Questions', value: `${form.questions.length}` },
    ...(isQuiz ? [{ label: 'Total Points', value: `${totalPoints}` }] : [{ label: 'Required', value: `${form.questions.filter(q => q.required).length}` }]),
    ...(form.settings.timeLimit ? [{ label: 'Time Limit', value: `${form.settings.timeLimit} min` }] : []),
    ...(form.settings.passingScore ? [{ label: 'Passing Score', value: `${form.settings.passingScore}%` }] : []),
    ...(form.settings.allowAnonymous ? [{ label: 'Anonymous', value: 'Enabled' }] : []),
    ...(form.expiresAt ? [{ label: 'Closes', value: form.expiresAt }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div className="builder-sticky-header" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(var(--bg-card-rgb), 0.92)', backdropFilter: 'blur(10px)', position: 'sticky', top: 60, zIndex: 50 }}>
        <div className="page-container" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="builder-header-row" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
              <HiOutlineArrowLeft size={16} />
            </button>

            <div style={{ flex: 1, minWidth: 240 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {label} Builder
              </p>
              <input
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(p => ({ ...p, title: '' })); }}
                placeholder={`${label} title`}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 24,
                  fontWeight: 700,
                  width: '100%',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1.2
                }}
              />
              {errors.title && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{errors.title}</p>}
            </div>

            <span className="badge badge-secondary" style={{ textTransform: 'uppercase' }}>{label}</span>
            <span className={`badge ${form.status === 'published' ? 'badge-success' : 'badge-secondary'}`} style={{ textTransform: 'uppercase' }}>
              {form.status || 'draft'}
            </span>
            <div className="builder-header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-secondary">
                <HiOutlineSave size={15} /> {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !isEdit}
                className="btn btn-primary"
                title={!isEdit ? 'Save the form first to publish it' : undefined}
              >
                <HiOutlineGlobe size={15} /> {publishing ? 'Working…' : form.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <div className="builder-workspace">
          <div className="builder-main">
            <div className="section-card">
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, marginBottom: 6 }}>Form Details</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Add context, choose a category, and set the visual accent for this form.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="form-input form-textarea"
                    placeholder={isQuiz ? 'Explain what this quiz covers.' : 'Explain what feedback or information you are collecting.'}
                    rows={3}
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="form-input form-select" style={{ fontSize: 13 }}>
                    {(isQuiz ? ['education', 'business', 'research', 'events', 'other'] : ['feedback', 'research', 'business', 'events', 'education', 'other']).map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {COVER_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, coverColor: c }))}
                        title={c}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: c,
                          border: form.coverColor === c ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          transition: 'all 0.15s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h2 style={{ fontSize: 18, marginBottom: 6 }}>Generate Questions with AI</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    Describe the form you want to create. Generated questions are added to this draft for review before saving.
                  </p>
                </div>
                <button onClick={handleGenerateQuestions} disabled={aiLoading} className="btn btn-primary">
                  {aiLoading ? 'Generating…' : 'Generate with AI'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">AI Prompt</label>
                <textarea
                  value={aiDraft.aiPrompt}
                  onChange={e => setAiDraft(current => ({ ...current, aiPrompt: e.target.value }))}
                  className="form-input form-textarea"
                  rows={5}
                  placeholder={aiPromptExample}
                  style={{ fontSize: 14, lineHeight: 1.6 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Example: {aiPromptExample}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Questions are not saved automatically. You can edit or remove them before publishing.
                </p>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 6 }}>Questions</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Build the form content in order. You can edit, duplicate, move, or remove each question.
                  </p>
                </div>
                {form.questions.length > 0 && (
                  <button onClick={() => addQ('multiple_choice')} className="btn btn-secondary">
                    <HiOutlinePlus size={16} /> Add Question
                  </button>
                )}
              </div>

              {errors.questions && (
                <div style={{ background: 'var(--danger-soft)', border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--bg-secondary) 72%)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>
                  {errors.questions}
                </div>
              )}

              {form.questions.length === 0 ? (
                <div className="section-card" style={{ textAlign: 'center', padding: '48px 24px', borderStyle: 'dashed' }}>
                  <h3 style={{ marginBottom: 8 }}>No questions yet</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                    Add a question from the sidebar or generate a draft with AI to get started.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {form.questions.map((q, i) => (
                    <div key={q.id}>
                      {errors[`q_${i}`] && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>{errors[`q_${i}`]}</p>}
                      <QuestionEditor question={q} index={i} total={form.questions.length} formType={type}
                        onChange={u => updateQ(i, u)} onDelete={() => deleteQ(i)} onDuplicate={dupQ} onMove={moveQ} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="builder-sidebar">
            <div className="section-card">
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Add Question
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questionTypes.map(qt => (
                  <button
                    key={qt.type}
                    className="builder-sidebar-action"
                    onClick={() => addQ(qt.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      width: '100%',
                      color: 'var(--text-primary)'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <span style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {qt.icon}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{qt.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{qt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{isQuiz ? 'Quiz Settings' : 'Survey Settings'}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Configure scoring, privacy, access, and closing behavior for this form.
                </p>
              </div>

              {isQuiz ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Time Limit</label>
                      <input type="number" className="form-input" value={form.settings.timeLimit || ''} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, timeLimit: e.target.value } }))} placeholder="No limit" min={1} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Passing Score</label>
                      <input type="number" className="form-input" value={form.settings.passingScore || ''} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, passingScore: e.target.value } }))} placeholder="Optional" min={0} max={100} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {[
                      { key: 'showScore', label: 'Show score after submission' },
                      { key: 'showCorrectAnswers', label: 'Reveal correct answers after submission' },
                      { key: 'shuffleQuestions', label: 'Shuffle question order' },
                      { key: 'allowMultipleResponses', label: 'Allow multiple attempts' },
                      { key: 'showProgressBar', label: 'Show progress bar' },
                    ].map(opt => (
                      <ToggleRow
                        key={opt.key}
                        label={opt.label}
                        checked={!!form.settings[opt.key]}
                        onChange={(checked) => setForm(f => ({ ...f, settings: { ...f.settings, [opt.key]: checked } }))}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {[
                    { key: 'allowAnonymous', label: 'Collect responses anonymously' },
                    { key: 'allowMultipleResponses', label: 'Allow multiple submissions' },
                    { key: 'showProgressBar', label: 'Show progress bar' },
                  ].map(opt => (
                    <ToggleRow
                      key={opt.key}
                      label={opt.label}
                      checked={!!form.settings[opt.key]}
                      onChange={(checked) => setForm(f => ({ ...f, settings: { ...f.settings, [opt.key]: checked } }))}
                      />
                    ))}
                  {!!form.settings.allowAnonymous && form.settings.allowMultipleResponses === false && (
                    <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--warning) 24%, var(--bg-secondary) 76%)', background: 'var(--warning-soft)', color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
                      Anonymous forms cannot reliably prevent multiple submissions from the same respondent.
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">{isQuiz ? 'Completion Message' : 'Thank You Message'}</label>
                  <input className="form-input" value={form.settings.confirmationMessage || ''} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, confirmationMessage: e.target.value } }))} placeholder={isQuiz ? 'Your quiz has been submitted.' : 'Thank you for your feedback.'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isQuiz ? 'Quiz Expires On' : 'Close Survey On'}</label>
                  <DateInput value={form.expiresAt || ''} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                  <span className="form-hint">Responses will stop after this date.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input className="form-input" value={form.tags || ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder={isQuiz ? 'math, midterm, chapter-3' : 'feedback, customers, q1'} />
                </div>
              </div>
            </div>

            <div className="section-card">
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>Form Summary</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Quick reference for the current draft.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {summaryItems.map((item, index) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: index === summaryItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: checked ? 'var(--bg-secondary)' : 'transparent' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
      <span>{label}</span>
    </label>
  );
}

const QUIZ_TYPES = [
  {type:'multiple_choice', label:'Multiple Choice', icon:'MC', desc:'One correct answer'},
  {type:'checkbox', label:'Checkboxes', icon:'CB', desc:'Multiple correct answers'},
  {type:'true_false', label:'True / False', icon:'TF', desc:'Binary choice'},
  {type:'short_answer', label:'Short Answer', icon:'SA', desc:'Text answer with key'},
  {type:'dropdown', label:'Dropdown', icon:'DD', desc:'Pick from list'},
];

const SURVEY_TYPES = [
  {type:'multiple_choice', label:'Multiple Choice', icon:'MC', desc:'Pick one option'},
  {type:'checkbox', label:'Checkboxes', icon:'CB', desc:'Pick multiple options'},
  {type:'short_answer', label:'Short Answer', icon:'SA', desc:'Brief text response'},
  {type:'paragraph', label:'Paragraph', icon:'PA', desc:'Long text answer'},
  {type:'rating', label:'Rating Scale', icon:'RT', desc:'Scale response'},
  {type:'dropdown', label:'Dropdown', icon:'DD', desc:'Select from list'},
  {type:'true_false', label:'Yes / No', icon:'TF', desc:'Binary choice'},
];

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function FormBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(isEdit);

  const defaultForm = (type) => ({
    title:'', description:'', category: type==='quiz' ? 'education' : 'feedback',
    coverColor: type==='quiz' ? '#0000FF' : '#00C8A7',
    questions:[], tags:'', expiresAt:'', status:'draft',
    settings: type==='quiz'
      ? { showScore:true, showCorrectAnswers:false, shuffleQuestions:false, timeLimit:'', passingScore:'', allowMultipleResponses:false, showProgressBar:true, confirmationMessage:'Great work! Your quiz has been submitted.' }
      : { allowAnonymous:false, allowMultipleResponses:true, showProgressBar:true, confirmationMessage:'Thank you for your feedback!' },
  });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/api/forms/${id}`).then(({ data }) => {
      const f = data.form;
      setSelectedType(f.type);
      setForm({ ...defaultForm(f.type), ...f, tags: Array.isArray(f.tags) ? f.tags.join(', ') : '', expiresAt: f.expiresAt ? f.expiresAt.split('T')[0] : '', settings: { ...defaultForm(f.type).settings, ...f.settings } });
    }).catch(() => { toast.error('Form not found'); navigate('/dashboard'); })
    .finally(() => setLoading(false));
  }, [id]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setForm(defaultForm(type));
  };

  const handleSaved = (newId) => navigate(`/forms/${newId}/edit`, { replace: true });

  if (loading) return <><Navbar /><PageLoader /></>;
  if (!selectedType || !form) return <TypeSelector onSelect={handleTypeSelect} />;

  return (
    <BuilderShell
      type={selectedType} form={form} setForm={setForm}
      formId={id} onSaved={handleSaved}
      questionTypes={selectedType === 'quiz' ? QUIZ_TYPES : SURVEY_TYPES}
    />
  );
}
