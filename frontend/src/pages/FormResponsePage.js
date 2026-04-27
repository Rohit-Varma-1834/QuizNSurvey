// Public page where people fill out and submit a form.
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Spinner } from '../components/ui/Common';

const QUESTIONS_PER_PAGE = 5;

const shuffleArray = (items = []) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const formatAnswer = (answer) => {
  if (Array.isArray(answer)) return answer.length ? answer.join(', ') : 'No answer';
  if (answer === null || answer === undefined || answer === '') return 'No answer';
  return answer.toString();
};

const formatTime = (seconds) => (
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
);

const estimateMinutes = (questionCount) => Math.max(1, Math.ceil(questionCount * 0.75));

export default function FormResponsePage() {
  const { publicId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [meta, setMeta] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const isAnonymousMode = Boolean(form?.settings?.allowAnonymous);
  const accentColor = form?.coverColor || 'var(--primary)';

  useEffect(() => {
    api.get(`/api/public/form/${publicId}`)
      .then(({ data }) => {
        const questions = data.form.settings?.shuffleQuestions
          ? shuffleArray(data.form.questions || [])
          : (data.form.questions || []);
        const formData = { ...data.form, questions };

        setForm(formData);

        const initialAnswers = {};
        questions.forEach((question) => {
          initialAnswers[question.id] = question.type === 'checkbox' ? [] : '';
        });
        setAnswers(initialAnswers);

        if (formData.settings?.timeLimit) {
          setTimeLeft(formData.settings.timeLimit * 60);
        }
      })
      .catch(() => setError('Form not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    if (timeLeft === null) return undefined;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return undefined;
    }

    timerRef.current = setTimeout(() => setTimeLeft((current) => current - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const setAnswer = (questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }));

  const toggleCheckbox = (questionId, option) => {
    setAnswers((current) => {
      const selected = current[questionId] || [];
      return {
        ...current,
        [questionId]: selected.includes(option)
          ? selected.filter((value) => value !== option)
          : [...selected, option]
      };
    });
  };

  const validate = () => {
    const nextErrors = {};
    const name = meta.name.trim();
    const email = meta.email.trim();

    if (!isAnonymousMode) {
      if (!name) nextErrors.name = 'Name is required';
      if (!email) nextErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address';
    }

    (form?.questions || []).forEach((question) => {
      if (!question.required) return;
      const answer = answers[question.id];
      if (!answer || (Array.isArray(answer) ? answer.length === 0 : answer.toString().trim() === '')) {
        nextErrors[question.id] = 'This question is required';
      }
    });

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !validate()) return;

    setSubmitting(true);
    clearTimeout(timerRef.current);

    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        respondentName: isAnonymousMode ? null : meta.name.trim(),
        respondentEmail: isAnonymousMode ? null : meta.email.trim(),
        isAnonymous: isAnonymousMode,
        timeTaken: Math.round((Date.now() - startTime) / 1000)
      };

      const { data } = await api.post(`/api/responses/submit/${publicId}`, payload);
      setResult(data.result);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const allQuestions = form?.questions || [];
  const totalPages = Math.ceil(allQuestions.length / QUESTIONS_PER_PAGE);
  const pageQuestions = allQuestions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );
  const answeredCount = Object.values(answers).filter((answer) => (
    answer !== '' && !(Array.isArray(answer) && answer.length === 0)
  )).length;
  const progress = form ? (answeredCount / allQuestions.length) * 100 : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <Spinner size={36} />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: 24
        }}
      >
        <div className="section-card" style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              borderRadius: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)'
            }}
          />
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Form Not Available</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <Link to={localStorage.getItem('token') ? '/dashboard' : '/'} className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
        <div className="public-form-shell">
          <div
            className="section-card"
            style={{
              overflow: 'hidden',
              padding: 0
            }}
          >
            <div style={{ height: 4, background: accentColor }} />

            <div style={{ padding: '32px 28px' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 10
                  }}
                >
                  Submission Complete
                </p>

                <h2 style={{ fontSize: 28, marginBottom: 10 }}>
                  {form.type === 'quiz' ? 'Quiz submitted successfully' : 'Thank you for your response'}
                </h2>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {result.confirmationMessage}
                </p>
              </div>

              {form.type === 'quiz' && result.score !== null && (
                <div
                  style={{
                    padding: '24px 20px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)',
                    textAlign: 'center',
                    marginBottom: 24
                  }}
                >
                  <p style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>
                    {result.percentage}%
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {result.score} / {result.totalPoints} points
                  </p>

                  {result.passed !== null && (
                    <div style={{ marginTop: 14 }}>
                      <span className={`badge ${result.passed ? 'badge-success' : 'badge-danger'}`}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {form.type === 'quiz' && Array.isArray(result.correctAnswers) && result.correctAnswers.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 4 }}>Answer Review</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Review your submitted answers and compare them with the correct answers.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {result.correctAnswers.map((answer, index) => (
                      <div
                        key={answer.questionId}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '16px 18px',
                          background: answer.isCorrect ? 'var(--success-soft)' : 'var(--bg-card)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            marginBottom: 10
                          }}
                        >
                          <p style={{ fontWeight: 700, lineHeight: 1.5 }}>
                            {index + 1}. {answer.questionText}
                          </p>
                          <span className={`badge ${answer.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                            {answer.isCorrect ? 'Correct' : 'Wrong'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gap: 10 }}>
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Your answer</p>
                            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                              {formatAnswer(answer.answer)}
                            </div>
                          </div>

                          <div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Correct answer</p>
                            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                              {formatAnswer(answer.correctAnswer)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Link to={localStorage.getItem('token') ? '/dashboard' : '/'} className="btn btn-secondary">
                  Go Home
                </Link>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                  Submit Another Response
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 48 }}>
      <div style={{ height: 4, background: accentColor }} />

      <div className="public-form-shell" style={{ paddingTop: 28 }}>
        <div
          className="section-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            marginBottom: 16
          }}
        >
          <div
            style={{
              padding: '24px 28px',
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 10
              }}
            >
              QuiznSurvey
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.35rem)', marginBottom: 10 }}>
              {form.title}
            </h1>
            {form.description && (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 18 }}>
                {form.description}
              </p>
            )}

            <div className="public-form-meta">
              <MetaPill label={`${allQuestions.length} ${allQuestions.length === 1 ? 'question' : 'questions'}`} />
              <MetaPill label={form.type === 'quiz' ? 'Quiz' : 'Survey'} />
              <MetaPill label={form.settings?.timeLimit ? `${form.settings.timeLimit} min time limit` : `${estimateMinutes(allQuestions.length)} min estimated`} />
              {isAnonymousMode && <MetaPill label="Anonymous responses enabled" />}
            </div>
          </div>

          {timeLeft !== null && (
            <div
              style={{
                padding: '12px 28px',
                borderBottom: '1px solid var(--border)',
                background: timeLeft < 60 ? 'var(--danger-soft)' : 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Time remaining
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: timeLeft < 60 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {formatTime(timeLeft)}
              </p>
            </div>
          )}

          {form.settings?.showProgressBar && (
            <div style={{ height: 4, background: 'var(--border)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: accentColor,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          )}
        </div>

        <div className="section-card" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>About your submission</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isAnonymousMode
                ? 'This form accepts anonymous responses. Your name and email will not be stored.'
                : 'Please provide your details before submitting your response.'}
            </p>
          </div>

          {isAnonymousMode ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              This form accepts anonymous responses. Your name and email will not be stored.
            </div>
          ) : (
            <div className="public-form-info-grid">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  placeholder="Your full name"
                  value={meta.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMeta((current) => ({ ...current, name: value }));
                    setValidationErrors((current) => ({ ...current, name: '' }));
                  }}
                />
                {validationErrors.name && <p className="form-error">{validationErrors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={meta.email}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMeta((current) => ({ ...current, email: value }));
                    setValidationErrors((current) => ({ ...current, email: '' }));
                  }}
                />
                {validationErrors.email && <p className="form-error">{validationErrors.email}</p>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pageQuestions.map((question, index) => {
            const globalIndex = currentPage * QUESTIONS_PER_PAGE + index;

            return (
              <div key={question.id} className="section-card" style={{ borderColor: validationErrors[question.id] ? 'var(--danger)' : 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div
                    style={{
                      minWidth: 36,
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {globalIndex + 1}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <p style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}>
                        {question.question}
                      </p>
                      {question.required && (
                        <span className="badge badge-danger">Required</span>
                      )}
                    </div>

                    {question.description && (
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {question.description}
                      </p>
                    )}
                  </div>
                </div>

                <QuestionInput
                  q={question}
                  answers={answers}
                  setAnswer={setAnswer}
                  toggleCheckbox={toggleCheckbox}
                  accentColor={accentColor}
                />

                {validationErrors[question.id] && (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10 }}>
                    {validationErrors[question.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="section-card" style={{ marginTop: 16 }}>
          <div className="public-form-footer">
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Page {currentPage + 1} of {totalPages || 1}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary"
              >
                Back
              </button>

              {currentPage < totalPages - 1 ? (
                <button onClick={() => setCurrentPage((page) => page + 1)} className="btn btn-primary">
                  Next
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ minWidth: 132 }}
                >
                  {submitting ? (
                    <>
                      <Spinner size={16} /> Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--danger)',
                background: 'var(--danger-soft)',
                color: 'var(--danger)'
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Powered by <strong style={{ color: 'var(--primary)' }}>QuiznSurvey</strong>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetaPill({ label }) {
  return <span className="badge badge-secondary">{label}</span>;
}

function QuestionInput({ q, answers, setAnswer, toggleCheckbox, accentColor }) {
  const answer = answers[q.id];

  if (q.type === 'short_answer') {
    return (
      <input
        className="form-input"
        placeholder="Your answer"
        value={answer}
        onChange={(event) => setAnswer(q.id, event.target.value)}
      />
    );
  }

  if (q.type === 'paragraph') {
    return (
      <textarea
        className="form-input form-textarea"
        placeholder="Your answer"
        value={answer}
        onChange={(event) => setAnswer(q.id, event.target.value)}
        rows={4}
      />
    );
  }

  if (q.type === 'rating') {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: q.ratingMax || 5 }, (_, index) => index + 1).map((rating) => (
          <button
            key={rating}
            onClick={() => setAnswer(q.id, rating)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: `1px solid ${answer === rating ? accentColor : 'var(--border)'}`,
              background: answer === rating ? accentColor : 'var(--bg-card)',
              color: answer === rating ? 'white' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 15,
              transition: 'all var(--transition)'
            }}
          >
            {rating}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(q.options || []).map((option) => (
          <label
            key={option}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${(answer || []).includes(option) ? accentColor : 'var(--border)'}`,
              background: (answer || []).includes(option) ? 'var(--bg-secondary)' : 'var(--bg-card)',
              transition: 'all var(--transition)'
            }}
          >
            <input
              type="checkbox"
              checked={(answer || []).includes(option)}
              onChange={() => toggleCheckbox(q.id, option)}
              style={{ accentColor }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (q.type === 'dropdown') {
    return (
      <select className="form-input form-select" value={answer} onChange={(event) => setAnswer(q.id, event.target.value)}>
        <option value="">Select an option</option>
        {(q.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(q.options || []).map((option) => (
        <label
          key={option}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '12px 14px',
            borderRadius: 10,
            border: `1px solid ${answer === option ? accentColor : 'var(--border)'}`,
            background: answer === option ? 'var(--bg-secondary)' : 'var(--bg-card)',
            transition: 'all var(--transition)'
          }}
        >
          <input
            type="radio"
            name={`q_${q.id}`}
            value={option}
            checked={answer === option}
            onChange={() => setAnswer(q.id, option)}
            style={{ accentColor }}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
