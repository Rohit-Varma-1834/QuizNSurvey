import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Spinner } from '../components/ui/Common';

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
  const QUESTIONS_PER_PAGE = 5;

  useEffect(() => {
    api.get(`/api/public/form/${publicId}`)
      .then(({ data }) => {
        setForm(data.form);
        // Init answers
        const init = {};
        data.form.questions.forEach(q => {
          init[q.id] = q.type === 'checkbox' ? [] : '';
        });
        setAnswers(init);
        // Timer
        if (data.form.settings?.timeLimit) {
          setTimeLeft(data.form.settings.timeLimit * 60);
        }
      })
      .catch(() => setError('Form not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [publicId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const setAnswer = (qId, val) => setAnswers(a => ({ ...a, [qId]: val }));

  const toggleCheckbox = (qId, opt) => {
    setAnswers(a => {
      const cur = a[qId] || [];
      return { ...a, [qId]: cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt] };
    });
  };

  const validate = () => {
    const errs = {};
    const name = meta.name.trim();
    const email = meta.email.trim();

    if (!name) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';

    (form?.questions || []).forEach(q => {
      if (!q.required) return;
      const ans = answers[q.id];
      if (!ans || (Array.isArray(ans) ? ans.length === 0 : ans.toString().trim() === '')) {
        errs[q.id] = 'This question is required';
      }
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !validate()) return;
    setSubmitting(true);
    clearTimeout(timerRef.current);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        respondentName: meta.name.trim(),
        respondentEmail: meta.email.trim(),
        isAnonymous: false,
        timeTaken: Math.round((Date.now() - startTime) / 1000),
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
  const pageQuestions = allQuestions.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE);
  const progress = form ? (Object.values(answers).filter(a => a !== '' && !(Array.isArray(a) && a.length === 0)).length / allQuestions.length) * 100 : 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Spinner size={36} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>😕</p>
      <h2 style={{ marginBottom: 8 }}>Form Not Available</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
      <Link to={localStorage.getItem('token') ? '/dashboard' : '/'} className="btn btn-primary">Go Home</Link>
    </div>
  );

  if (submitted && result) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, rgba(var(--bg-rgb),1) 0%, rgba(var(--primary-rgb),0.08) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: '40px 36px', textAlign: 'center', animation: 'scaleIn 0.4s ease' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {form.type === 'quiz' ? (result.passed === true ? '🎉' : result.passed === false ? '😕' : '✅') : '🙏'}
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>
          {form.type === 'quiz' ? (result.passed === true ? 'Great job!' : result.passed === false ? 'Better luck next time!' : 'Submitted!') : 'Thank you!'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>{result.confirmationMessage}</p>

        {form.type === 'quiz' && result.score !== null && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '24px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-display)', color: result.passed === true ? 'var(--secondary)' : result.passed === false ? 'var(--danger)' : 'var(--primary)' }}>
              {result.percentage}%
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              {result.score} / {result.totalPoints} points
            </p>
            {result.passed !== null && (
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${result.passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 13, padding: '4px 14px' }}>
                  {result.passed ? '✓ Passed' : '✗ Failed'}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to={localStorage.getItem('token') ? '/dashboard' : '/'} className="btn btn-secondary">Go Home</Link>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Submit Again</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      {/* Form header */}
      <div style={{ background: form.coverColor || 'var(--primary)', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {form.type}
          </span>
          <h1 style={{ color: 'white', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginTop: 10, marginBottom: 8 }}>
            {form.title}
          </h1>
          {form.description && (
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.6 }}>{form.description}</p>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {allQuestions.length} question{allQuestions.length !== 1 ? 's' : ''}
            </span>
            {form.settings?.timeLimit && (
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>⏱ {form.settings.timeLimit} min limit</span>
            )}
          </div>
        </div>
      </div>

      {/* Timer */}
      {timeLeft !== null && (
        <div style={{
          background: timeLeft < 60 ? 'var(--danger-soft)' : 'var(--success-soft)',
          borderBottom: `1px solid ${timeLeft < 60 ? 'var(--danger)' : 'var(--secondary)'}`,
          padding: '8px 24px', textAlign: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: timeLeft < 60 ? 'var(--danger)' : 'var(--secondary)', fontFamily: 'var(--font-display)' }}>
            ⏱ {formatTime(timeLeft)}
          </span>
          {timeLeft < 60 && <span style={{ fontSize: 13, color: 'var(--danger)', marginLeft: 8 }}>- Hurry up!</span>}
        </div>
      )}

      {/* Progress bar */}
      {form.settings?.showProgressBar && (
        <div style={{ height: 4, background: 'var(--border)' }}>
          <div style={{ height: '100%', background: form.coverColor, width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        {/* Respondent info */}
        <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Your Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                className="form-input"
                placeholder="Your full name"
                value={meta.name}
                onChange={e => {
                  const value = e.target.value;
                  setMeta(m => ({ ...m, name: value }));
                  setValidationErrors(v => ({ ...v, name: '' }));
                }}
              />
              {validationErrors.name && <p className="form-error">{validationErrors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={meta.email}
                onChange={e => {
                  const value = e.target.value;
                  setMeta(m => ({ ...m, email: value }));
                  setValidationErrors(v => ({ ...v, email: '' }));
                }}
              />
              {validationErrors.email && <p className="form-error">{validationErrors.email}</p>}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pageQuestions.map((q, qi) => {
            const globalIndex = currentPage * QUESTIONS_PER_PAGE + qi;
            return (
              <div key={q.id} className="card" style={{ padding: '20px 22px', borderLeft: `4px solid ${validationErrors[q.id] ? 'var(--danger)' : form.coverColor}` }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{ background: form.coverColor, color: 'white', width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {globalIndex + 1}
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.5 }}>
                      {q.question}
                      {q.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
                    </p>
                    {q.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{q.description}</p>}
                  </div>
                </div>

                <QuestionInput q={q} answers={answers} setAnswer={setAnswer} toggleCheckbox={toggleCheckbox} coverColor={form.coverColor} />

                {validationErrors[q.id] && (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>⚠️ {validationErrors[q.id]}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination / Submit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="btn btn-secondary"
          >← Back</button>

          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Page {currentPage + 1} of {totalPages || 1}
          </span>

          {currentPage < totalPages - 1 ? (
            <button onClick={() => setCurrentPage(p => p + 1)} className="btn btn-primary">
              Next →
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="btn btn-primary"
              style={{ background: form.coverColor, minWidth: 120, justifyContent: 'center' }}
            >
              {submitting ? <><Spinner size={16} /> Submitting…</> : '✓ Submit'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--bg-secondary) 72%)', borderRadius: 8, padding: '10px 16px', marginTop: 16, fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 24px', borderTop: '1px solid var(--border)', marginTop: 20 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Powered by <strong style={{ color: 'var(--primary)' }}>QuiznSurvey</strong>
        </Link>
      </div>
    </div>
  );
}

function QuestionInput({ q, answers, setAnswer, toggleCheckbox, coverColor }) {
  const ans = answers[q.id];

  if (q.type === 'short_answer') return (
    <input className="form-input" placeholder="Your answer" value={ans} onChange={e => setAnswer(q.id, e.target.value)} />
  );

  if (q.type === 'paragraph') return (
    <textarea className="form-input form-textarea" placeholder="Your answer" value={ans} onChange={e => setAnswer(q.id, e.target.value)} rows={4} />
  );

  if (q.type === 'rating') return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {Array.from({ length: q.ratingMax || 5 }, (_, i) => i + 1).map(n => (
        <button key={n} onClick={() => setAnswer(q.id, n)} style={{
          width: 44, height: 44, borderRadius: 10,
          border: `2px solid ${ans === n ? coverColor : 'var(--border)'}`,
          background: ans === n ? coverColor : 'transparent',
          color: ans === n ? 'white' : 'var(--text-primary)',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s'
        }}>
          {n}
        </button>
      ))}
    </div>
  );

  if (q.type === 'checkbox') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.options || []).map(opt => (
        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${(ans || []).includes(opt) ? coverColor : 'var(--border)'}`, background: (ans || []).includes(opt) ? `${coverColor}12` : 'transparent', transition: 'all 0.15s', fontSize: 14 }}>
          <input type="checkbox" checked={(ans || []).includes(opt)} onChange={() => toggleCheckbox(q.id, opt)} style={{ accentColor: coverColor }} />
          {opt}
        </label>
      ))}
    </div>
  );

  if (q.type === 'dropdown') return (
    <select className="form-input form-select" value={ans} onChange={e => setAnswer(q.id, e.target.value)}>
      <option value="">Select an option</option>
      {(q.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );

  // multiple_choice and true_false
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.options || []).map(opt => (
        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${ans === opt ? coverColor : 'var(--border)'}`, background: ans === opt ? `${coverColor}12` : 'transparent', transition: 'all 0.15s', fontSize: 14 }}>
          <input type="radio" name={`q_${q.id}`} value={opt} checked={ans === opt} onChange={() => setAnswer(q.id, opt)} style={{ accentColor: coverColor }} />
          {opt}
        </label>
      ))}
    </div>
  );
}
