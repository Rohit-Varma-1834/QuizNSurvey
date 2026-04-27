// Shows detailed submitted responses for a selected form.
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineX
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { PageLoader, EmptyState, ConfirmDialog } from '../components/ui/Common';

const formatLocalDateInput = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const answerToText = (answer) => {
  if (Array.isArray(answer)) return answer.join(', ');
  if (answer === null || answer === undefined || answer === '') return '';
  return answer.toString();
};

const formatResponseDate = (value) => (
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
);

const formatTimeTaken = (timeTaken) => {
  if (!timeTaken && timeTaken !== 0) return null;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  return `${minutes}m ${seconds}s`;
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

  const isQuiz = form?.type === 'quiz';
  const totalResponses = pagination.total || 0;

  const getDisplayName = (response) => (
    response.isAnonymous
      ? 'Anonymous Respondent'
      : (response.respondentName || 'Anonymous Respondent')
  );

  const getContactLine = (response) => (
    response.isAnonymous
      ? 'Anonymous response'
      : (response.respondentEmail || 'No email provided')
  );

  const hasActiveFilters = Boolean(searchText.trim() || dateFrom || dateTo || quizStatus);

  const filteredResponses = responses.filter((response) => {
    const displayName = getDisplayName(response);
    const email = response.isAnonymous ? '' : (response.respondentEmail || '');
    const answerText = response.answers
      .map((answer) => `${answer.questionText} ${answerToText(answer.answer)}`)
      .join(' ')
      .toLowerCase();
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

    if (isQuiz && quizStatus) {
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
      } catch {
        toast.error('Failed to load responses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, page]);

  const handleDelete = async () => {
    try {
      await api.delete(`/api/responses/${deleteId}`);
      setResponses((current) => current.filter((response) => response._id !== deleteId));
      toast.success('Response deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteId(null);
    }
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
    if (!responses.length && !totalResponses) {
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

  const clearFilters = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setQuizStatus('');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoader />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div className="page-container" style={{ maxWidth: 1120 }}>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px 10px', flexShrink: 0 }}
            >
              <HiOutlineArrowLeft size={16} />
            </button>

            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Response Review
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginTop: 4 }}>
                {form?.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                {totalResponses} {totalResponses === 1 ? 'response' : 'responses'} collected
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleExport}
              className="btn btn-secondary btn-sm"
              disabled={exporting}
            >
              <HiOutlineDownload size={15} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>

            <Link to={`/forms/${id}/analytics`} className="btn btn-secondary btn-sm">
              <HiOutlineChartBar size={15} />
              Analytics
            </Link>

            <button
              onClick={handleGenerateSummary}
              className="btn btn-primary btn-sm"
              disabled={summaryLoading || totalResponses === 0}
            >
              {summaryLoading ? 'Generating...' : 'Generate AI Summary'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section
            className="section-card"
            style={{
              borderColor: aiSummary ? 'rgba(var(--primary-rgb), 0.22)' : 'var(--border)',
              background: aiSummary
                ? 'linear-gradient(180deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--primary-rgb), 0.015) 100%)'
                : 'var(--bg-card)'
            }}
          >
            <div className="page-header" style={{ marginBottom: aiSummary ? 18 : 0 }}>
              <div>
                <h2 style={{ fontSize: 20 }}>AI Insights</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                  Generate a concise summary of trends, strengths, issues, and suggested next steps.
                </p>
              </div>

              <button
                onClick={handleGenerateSummary}
                className="btn btn-secondary btn-sm"
                disabled={summaryLoading || totalResponses === 0}
              >
                {summaryLoading ? 'Generating...' : 'Refresh Summary'}
              </button>
            </div>

            {aiSummary ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <div
                  style={{
                    padding: '14px 16px',
                    border: '1px solid rgba(var(--primary-rgb), 0.12)',
                    borderRadius: 'var(--radius)',
                    background: 'rgba(var(--bg-card-rgb), 0.82)'
                  }}
                >
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {aiSummary.overallSummary}
                  </p>
                </div>

                <div className="grid-2" style={{ gap: 14 }}>
                  <SummaryList title="Key Trends" items={aiSummary.keyTrends} />
                  <SummaryList title="Common Positive Feedback" items={aiSummary.positiveFeedback} />
                  <SummaryList title="Common Issues" items={aiSummary.negativeFeedback} />
                  <SummaryList title="Suggested Actions" items={aiSummary.suggestedActions} />
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '18px 20px',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  background: 'rgba(var(--bg-card-rgb), 0.68)'
                }}
              >
                {totalResponses === 0
                  ? 'This form needs at least one response before an AI summary can be generated.'
                  : 'Generate a summary when you want a quick read on recurring themes, positive feedback, issues, and suggested actions.'}
              </div>
            )}
          </section>

          {totalResponses === 0 ? (
            <section className="section-card">
              <EmptyState
                icon="NR"
                title="No responses yet"
                description="Share your form to start collecting responses, then return here to review submissions."
              />
            </section>
          ) : (
            <>
              <section className="toolbar-row" style={{ padding: 18 }}>
                <div
                  className={`responses-filter-grid ${isQuiz ? 'responses-filter-grid-quiz' : 'responses-filter-grid-survey'}`}
                  style={{
                    gap: 12,
                    width: '100%'
                  }}
                >
                  <input
                    className="form-input"
                    placeholder="Search respondent, email, or answer text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />

                  <input
                    className="form-input"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />

                  <input
                    className="form-input"
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                  />

                  {isQuiz && (
                    <select
                      className="form-input form-select"
                      value={quizStatus}
                      onChange={(event) => setQuizStatus(event.target.value)}
                    >
                      <option value="">All Results</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                  )}

                  {hasActiveFilters ? (
                    <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ justifySelf: 'start' }}>
                      <HiOutlineX size={14} />
                      Clear Filters
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </section>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Showing {filteredResponses.length} of {responses.length} loaded responses
                </p>

                {hasActiveFilters && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Filters are applied to the responses loaded on this page.
                  </p>
                )}
              </div>

              {filteredResponses.length === 0 ? (
                <section className="section-card">
                  <EmptyState
                    icon="NF"
                    title="No responses match these filters"
                    description="Try adjusting the search text, date range, or quiz result filter."
                  />
                </section>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filteredResponses.map((response) => {
                    const displayName = getDisplayName(response);
                    const timeTaken = formatTimeTaken(response.timeTaken);

                    return (
                      <article key={response._id} className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 16,
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ display: 'flex', gap: 14, minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 12,
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{displayName}</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>{getContactLine(response)}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                  Submitted {formatResponseDate(response.submittedAt)}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                                justifyContent: 'flex-end'
                              }}
                            >
                              {isQuiz && response.percentage !== null && (
                                <div
                                  style={{
                                    padding: '10px 12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    textAlign: 'right',
                                    minWidth: 96,
                                    background: 'var(--bg-secondary)'
                                  }}
                                >
                                  <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>
                                    {response.percentage}%
                                  </p>
                                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {response.score}/{response.totalPoints} points
                                  </p>
                                </div>
                              )}

                              {response.passed !== null && (
                                <span className={`badge ${response.passed ? 'badge-success' : 'badge-danger'}`}>
                                  {response.passed ? 'Passed' : 'Failed'}
                                </span>
                              )}

                              {timeTaken && (
                                <span className="badge badge-neutral">
                                  {timeTaken}
                                </span>
                              )}

                              <button
                                onClick={() => setExpanded(expanded === response._id ? null : response._id)}
                                className="btn btn-secondary btn-sm"
                              >
                                {expanded === response._id ? 'Collapse' : 'Expand'}
                                {expanded === response._id ? <HiOutlineChevronUp size={15} /> : <HiOutlineChevronDown size={15} />}
                              </button>

                              <button
                                onClick={() => setDeleteId(response._id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)' }}
                              >
                                <HiOutlineTrash size={15} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {expanded === response._id && (
                          <div
                            style={{
                              borderTop: '1px solid var(--border)',
                              background: 'var(--bg-secondary)',
                              padding: '18px 20px'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {response.answers.map((answer, index) => {
                                const question = form?.questions?.find((item) => item.id === answer.questionId);
                                const submittedAnswer = answerToText(answer.answer);
                                const correctAnswer = Array.isArray(question?.correctAnswer)
                                  ? question.correctAnswer.join(', ')
                                  : question?.correctAnswer;

                                return (
                                  <article
                                    key={`${response._id}-${answer.questionId}-${index}`}
                                    style={{
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border)',
                                      borderRadius: 'var(--radius)',
                                      padding: '16px 18px'
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                        flexWrap: 'wrap',
                                        marginBottom: 12
                                      }}
                                    >
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <p
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            color: 'var(--text-muted)',
                                            marginBottom: 4
                                          }}
                                        >
                                          Question {index + 1}
                                        </p>
                                        <h4 style={{ fontSize: 15, lineHeight: 1.5 }}>
                                          {answer.questionText}
                                        </h4>
                                      </div>

                                      {isQuiz && answer.isCorrect !== null && (
                                        <span className={`badge ${answer.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                                          {answer.isCorrect ? 'Correct' : 'Wrong'}
                                          {' '}
                                          ({answer.pointsEarned}/{question?.points || 1} pt)
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'grid', gap: 12 }}>
                                      <div>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                          Submitted answer
                                        </p>
                                        <div
                                          style={{
                                            padding: '11px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-secondary)',
                                            color: submittedAnswer ? 'var(--text-primary)' : 'var(--text-muted)'
                                          }}
                                        >
                                          {submittedAnswer || 'No answer provided'}
                                        </div>
                                      </div>

                                      {isQuiz && !answer.isCorrect && correctAnswer && (
                                        <div>
                                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                            Correct answer
                                          </p>
                                          <div
                                            style={{
                                              padding: '11px 12px',
                                              borderRadius: 'var(--radius-sm)',
                                              border: '1px solid rgba(22, 163, 74, 0.24)',
                                              background: 'var(--success-soft)',
                                              color: 'var(--text-primary)'
                                            }}
                                          >
                                            {correctAnswer}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {pagination.pages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginTop: 4
                  }}
                >
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Page {page} of {pagination.pages}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Array.from({ length: pagination.pages }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setPage(index + 1)}
                        className={`btn btn-sm ${page === index + 1 ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
    <div
      style={{
        padding: '16px 18px',
        border: '1px solid rgba(var(--primary-rgb), 0.12)',
        borderRadius: 'var(--radius)',
        background: 'rgba(var(--bg-card-rgb), 0.82)'
      }}
    >
      <h3 style={{ fontSize: 14, marginBottom: 10 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)'
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
