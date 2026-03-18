import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { PageLoader, EmptyState, ConfirmDialog } from '../components/ui/Common';
import { HiOutlineArrowLeft, HiOutlineTrash, HiOutlineChartBar } from 'react-icons/hi';
import toast from 'react-hot-toast';

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
          <Link to={`/forms/${id}/analytics`} className="btn btn-primary btn-sm">
            <HiOutlineChartBar size={15} /> Analytics
          </Link>
        </div>

        {responses.length === 0 ? (
          <EmptyState icon="📭" title="No responses yet" description="Share your form to start collecting responses." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {responses.map((r, i) => (
              <div key={r._id} className="card" style={{ overflow: 'hidden' }}>
                <div
                  style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {r.respondentName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{r.respondentName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.respondentEmail || 'No email'} · {new Date(r.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
            ))}

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
