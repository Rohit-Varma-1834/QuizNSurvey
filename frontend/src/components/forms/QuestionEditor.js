// UI component for creating and editing form questions.
import React, { useState } from 'react';
import {
  HiOutlineTrash, HiOutlinePlus,
  HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineDuplicate
} from 'react-icons/hi';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'true_false', label: 'True / False' },
  { value: 'rating', label: 'Rating Scale' },
  { value: 'dropdown', label: 'Dropdown' },
];

export default function QuestionEditor({ question, index, onChange, onDelete, onDuplicate, onMove, total, formType }) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (field, value) => onChange({ ...question, [field]: value });

  const addOption = () => update('options', [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]);

  const updateOption = (i, val) => {
    const opts = [...(question.options || [])];
    opts[i] = val;
    update('options', opts);
  };

  const removeOption = (i) => {
    const opts = question.options.filter((_, idx) => idx !== i);
    update('options', opts);
    if (question.correctAnswer === question.options[i]) update('correctAnswer', null);
  };

  const renderOptionsSection = () => {
    if (['short_answer', 'paragraph'].includes(question.type)) {
      return (
        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 12, fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          Respondents will answer this question with text.
        </div>
      );
    }

    if (question.type === 'rating') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Maximum rating</span>
            <select
              value={question.ratingMax || 5}
              onChange={e => update('ratingMax', Number(e.target.value))}
              className="form-input form-select"
              style={{ width: 92 }}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: question.ratingMax || 5 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)'
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (question.type === 'true_false') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['True', 'False'].map(opt => (
            <div key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)',
              background: formType === 'quiz' && question.correctAnswer === opt ? 'var(--success-soft)' : 'var(--bg-card)'
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14 }}>{opt}</span>
              {formType === 'quiz' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswer === opt}
                    onChange={() => update('correctAnswer', opt)}
                  />
                  Correct
                </label>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Multiple choice, checkbox, dropdown
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(question.options || []).map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 18, height: 18, flexShrink: 0,
              borderRadius: question.type === 'checkbox' ? 4 : '50%',
              border: '2px solid var(--border)'
            }} />
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
              placeholder={`Option ${i + 1}`}
            />
            {formType === 'quiz' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)', whiteSpace: 'nowrap', padding: '0 4px' }}>
                <input
                  type={question.type === 'checkbox' ? 'checkbox' : 'radio'}
                  name={`correct-${question.id}`}
                  checked={question.type === 'checkbox'
                    ? (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(opt))
                    : question.correctAnswer === opt}
                  onChange={() => {
                    if (question.type === 'checkbox') {
                      const current = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                      update('correctAnswer', current.includes(opt) ? current.filter(c => c !== opt) : [...current, opt]);
                    } else {
                      update('correctAnswer', opt);
                    }
                  }}
                />
                Correct
              </label>
            )}
            {(question.options || []).length > 1 && (
              <button onClick={() => removeOption(i)} className="btn btn-ghost btn-sm" style={{ padding: 5, color: 'var(--danger)' }}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addOption} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', color: 'var(--primary)' }}>
          <HiOutlinePlus size={14} /> Add Option
        </button>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap'
      }}>
        <div style={{ minWidth: 88 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            Question
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {index + 1}
          </p>
        </div>
        <select
          value={question.type}
          onChange={e => {
            const newType = e.target.value;
            const updates = { type: newType, correctAnswer: null };
            if (newType === 'true_false') updates.options = ['True', 'False'];
            else if (['multiple_choice', 'checkbox', 'dropdown'].includes(newType) && !question.options?.length)
              updates.options = ['Option 1', 'Option 2'];
            onChange({ ...question, ...updates });
          }}
          className="form-input form-select"
          style={{ fontSize: 13, padding: '8px 36px 8px 12px', flex: 1, minWidth: 190, maxWidth: 220 }}
        >
          {QUESTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => onMove(index, -1)} disabled={index === 0} className="btn btn-ghost btn-sm" style={{ padding: 5 }}>
            <HiOutlineChevronUp size={14} />
          </button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="btn btn-ghost btn-sm" style={{ padding: 5 }}>
            <HiOutlineChevronDown size={14} />
          </button>
          <button onClick={() => onDuplicate(index)} className="btn btn-ghost btn-sm" style={{ padding: 5 }}>
            <HiOutlineDuplicate size={14} />
          </button>
          <button onClick={() => onDelete(index)} className="btn btn-ghost btn-sm" style={{ padding: 5, color: 'var(--danger)' }}>
            <HiOutlineTrash size={15} />
          </button>
          <button onClick={() => setCollapsed(p => !p)} className="btn btn-ghost btn-sm" style={{ padding: 5 }}>
            {collapsed ? <HiOutlineChevronDown size={14} /> : <HiOutlineChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Question Text</label>
            <input
              value={question.question}
              onChange={e => update('question', e.target.value)}
              className="form-input"
              placeholder="Enter your question..."
              style={{ fontSize: 15, fontWeight: 600 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              value={question.description || ''}
              onChange={e => update('description', e.target.value)}
              className="form-input"
              placeholder="Add optional guidance for respondents"
              style={{ fontSize: 13, color: 'var(--text-secondary)' }}
            />
          </div>

          <div style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-card)' }}>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Answer Setup
              </p>
            </div>
            {renderOptionsSection()}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 14, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={question.required}
                onChange={e => update('required', e.target.checked)}
              />
              Required
            </label>

            {formType === 'quiz' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Points:</span>
                <input
                  type="number"
                  value={question.points || 1}
                  onChange={e => update('points', Math.max(0, parseInt(e.target.value) || 0))}
                  className="form-input"
                  style={{ width: 72, padding: '6px 8px', fontSize: 13 }}
                  min={0}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
