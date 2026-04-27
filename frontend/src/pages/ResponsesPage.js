// Shows detailed submitted responses for a selected form.
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { PageLoader, EmptyState, ConfirmDialog } from '../components/ui/Common';
import { HiOutlineArrowLeft, HiOutlineTrash, HiOutlineChartBar, HiOutlineDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';

const formatLocalDateInput = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const answerToText = (answer) => {
  if (Array.isArray(answer)) return answer.join(' ');
  if (answer === null || answer === undefined) return '';
  return answer.toString();
};

export default function ResponsesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quizStatus, setQuizStatus] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const getDisplayName = (response) =>
    response.isAnonymous ? 'Anonymous Respondent' : (response.respondentName || 'Anonymous Respondent');

  const hasActiveFilters = Boolean(searchText.trim() || dateFrom || dateTo || quizStatus);

  const filteredResponses = responses.filter((response) => {
    const displayName = getDisplayName(response);
    const email = response.isAnonymous ? '' : (response.respondentEmail || '');
    const answerText = response.answers.map(answer => `${answer.questionText} ${answerToText(answer.answer)}`).join(' ').toLowerCase();
    const searchTerm = searchText.trim().toLowerCase();
    const submittedDate = formatLocalDateInput(response.submittedAt);

    if (searchTerm) {
      const matchesSearch =
        displayName.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm) ||
        answerText.includes(searchTerm);

      if (!matchesSearch) return false;
    }

    if (dateFrom && submittedDate < dateFrom) return false;
    if (dateTo && submittedDate > dateTo) return false;

    if (form?.type === 'quiz' && quizStatus) {
      if (quizStatus === 'passed' && response.passed !== true) return false;
      if (quizStatus === 'failed' && response.passed !== false) return false;
    }

    return true;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [formRes, respRes] = await Promise.all([
          api.get(`/api/forms/${id}`),
          api.get(`/api/responses/form/${id}`, { params: { page, limit: 15 } })
        ]);
        setForm(formRes.data.form);
        setResponses(respRes.data.responses);
        setPagination(respRes.data.pagination);
      } catch { toast.error('Failed to load responses'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, page]);

  const handleDelete = async () => {
    try {
      await api.delete(`/api/responses/${deleteId}`);
      setResponses(r => r.filter(x => x._id !== deleteId));
      toast.success('Response deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/api/responses/form/${id}/export`, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] || `${form?.title || 'responses'}-responses.csv`;
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('CSV export started');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export responses');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!responses.length && !pagination.total) {
      toast.error('This form has no responses to summarize yet');
      return;
    }

    setSummaryLoading(true);
    try {
      const { data } = await api.post(`/api/ai/summarize-responses/${id}`);
      setAiSummary(data.summary);
      toast.success('AI summary generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) return <><Navbar /><PageLoader /></>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px' }}>
            <HiOutlineArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{form?.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {pagination.total || 0} total responses
            </p>
          </div>
          <button onClick={handleExport} className="btn btn-secondary btn-sm" disabled={exporting}>
            <HiOutlineDownload size={15} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={handleGenerateSummary} className="btn btn-secondary btn-sm" disabled={summaryLoading || (pagination.total || 0) === 0}>
            {summaryLoading ? 'Generating…' : 'Generate AI Summary'}
          </button>
          <Link to={`/forms/${id}/analytics`} className="btn btn-primary btn-sm">
            <HiOutlineChartBar size={15} /> Analytics
          </Link>
        </div>

        {responses.length === 0 ? (
          <EmptyState icon="📭" title="No responses yet" description="Share your form to start collecting responses." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiSummary && (
              <div className="card" style={{ padding: '20px 22px', borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>AI Response Summary</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                  {aiSummary.overallSummary}
                </p>
                <SummaryList title="Key Trends" items={aiSummary.keyTrends} />
                <SummaryList title="Common Positive Feedback" items={aiSummary.positiveFeedback} />
                <SummaryList title="Common Issues" items={aiSummary.negativeFeedback} />
                <SummaryList title="Suggested Actions" items={aiSummary.suggestedActions} />
              </div>
            )}

            <div
              className="card"
              style={{
                padding: '16px 18px',
                display: 'grid',
                gridTemplateColumns: form?.type === 'quiz' ? 'minmax(220px, 1.5fr) repeat(3, minmax(140px, 1fr))' : 'minmax(220px, 1.5fr) repeat(2, minmax(140px, 1fr))',
                gap: 12
              }}
            >
              <input
                className="form-input"
                placeholder="Search name, email, or answers..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <input
                className="form-input"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
              <input
                className="form-input"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
              {form?.type === 'quiz' && (
                <select
                  className="form-input form-select"
                  value={quizStatus}
                  onChange={e => setQuizStatus(e.target.value)}
                >
                  <option value="">All Results</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              )}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {filteredResponses.length} of {responses.length} loaded responses
            </p>

            {filteredResponses.length === 0 ? (
              <EmptyState
                icon="🔎"
                title="No responses match these filters"
                description={hasActiveFilters ? 'Try changing your search text or date/status filters.' : 'No responses found.'}
              />
            ) : filteredResponses.map((r) => {
              const displayName = getDisplayName(r);

              return (
              <div key={r._id} className="card" style={{ overflow: 'hidden' }}>
                <div
                  style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {displayName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.isAnonymous ? 'Anonymous response' : (r.respondentEmail || 'No email')} · {new Date(r.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {form?.type === 'quiz' && r.percentage !== null && (
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <p style={{ fontWeight: 800, fontSize: 18, color: r.percentage >= 60 ? 'var(--secondary)' : 'var(--danger)' }}>
                        {r.percentage}%
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.score}/{r.totalPoints} pts</p>
                    </div>
                  )}
                  {r.passed !== null && (
                    <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>
                      {r.passed ? 'Passed' : 'Failed'}
                    </span>
                  )}
                  {r.timeTaken && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ⏱ {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteId(r._id); }}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 6, color: 'var(--danger)', flexShrink: 0 }}
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {expanded === r._id ? '▲' : '▼'}
                  </span>
                </div>

                {expanded === r._id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {r.answers.map((ans, ai) => {
                        const q = form?.questions?.find(q => q.id === ans.questionId);
                        return (
                          <div key={ai} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                              <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ai + 1}</span>
                              <p style={{ fontWeight: 600, fontSize: 14 }}>{ans.questionText}</p>
                              {form?.type === 'quiz' && ans.isCorrect !== null && (
                                <span className={`badge ${ans.isCorrect ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                  {ans.isCorrect ? '✓ Correct' : '✗ Wrong'} ({ans.pointsEarned}/{q?.points || 1}pt)
                                </span>
                              )}
                            </div>
                            <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 14 }}>
                              {Array.isArray(ans.answer) ? ans.answer.join(', ') : (ans.answer?.toString() || <em style={{ color: 'var(--text-muted)' }}>No answer</em>)}
                            </div>
                            {form?.type === 'quiz' && q?.correctAnswer !== null && ans.isCorrect === false && (
                              <p style={{ fontSize: 12, color: 'var(--secondary)', marginTop: 6 }}>
                                ✓ Correct answer: <strong>{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</strong>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              );
            })}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Response"
        message="Are you sure you want to delete this response? This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function SummaryList({ title, items }) {
  if (!items?.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div key={item} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 13 }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
