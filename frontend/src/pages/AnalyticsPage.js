import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { PageLoader, StatCard } from '../components/ui/Common';
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

export default function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/analytics/form/${id}`);
      setAnalytics(data.analytics);
    } catch { setError('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, [id]);

  if (loading) return <><Navbar /><PageLoader /></>;
  if (error) return <><Navbar /><div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--danger)' }}>{error}</p><Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>Back</Link></div></>;

  const a = analytics;
  const form = a.form;

  // Daily responses chart
  const lineData = {
    labels: (a.dailyResponses || []).map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Responses',
      data: (a.dailyResponses || []).map(d => d.count),
      fill: true,
      backgroundColor: 'rgba(99,102,241,0.1)',
      borderColor: '#6366f1',
      borderWidth: 2.5,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
    }]
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px' }}>
            <HiOutlineArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{form.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
              {form.type} · {form.status}
            </p>
          </div>
          <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm"><HiOutlineRefresh size={15} /> Refresh</button>
          <Link to={`/forms/${id}/responses`} className="btn btn-primary btn-sm"><HiOutlineEye size={15} /> View Responses</Link>
        </div>

        {a.totalResponses === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📊</p>
            <h3 style={{ marginBottom: 8 }}>No responses yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Share your form to start collecting responses and see analytics here.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Responses" value={a.totalResponses} icon="📋" color="#6366f1" />
              {form.type === 'quiz' && a.avgPercentage !== null && (
                <StatCard label="Avg Score" value={`${a.avgPercentage}%`} icon="🎯" color="#10b981" />
              )}
              {a.passRate !== null && (
                <StatCard label="Pass Rate" value={`${a.passRate}%`} icon="✅" color="#f59e0b" />
              )}
              {a.avgTime && (
                <StatCard label="Avg Time" value={`${Math.floor(a.avgTime / 60)}m ${a.avgTime % 60}s`} icon="⏱" color="#8b5cf6" />
              )}
            </div>

            {/* Response Trend */}
            {a.dailyResponses?.length > 0 && (
              <div className="card" style={{ padding: '20px 22px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>📈 Response Trend (Last 30 Days)</h3>
                <div style={{ height: 220 }}>
                  <Line data={lineData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                </div>
              </div>
            )}

            {/* Score distribution for quizzes */}
            {form.type === 'quiz' && a.scoreDistribution && (
              <div className="card" style={{ padding: '20px 22px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>🏆 Score Distribution</h3>
                <div style={{ height: 220 }}>
                  <Bar
                    data={{
                      labels: Object.keys(a.scoreDistribution),
                      datasets: [{
                        label: 'Respondents',
                        data: Object.values(a.scoreDistribution),
                        backgroundColor: CHART_COLORS.map(c => `${c}cc`),
                        borderColor: CHART_COLORS,
                        borderWidth: 1.5,
                        borderRadius: 6,
                      }]
                    }}
                    options={{ ...chartOpts, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            )}

            {/* Question breakdown */}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Question Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(a.questionBreakdown || []).map((qb, i) => (
                <QuestionAnalyticsCard key={qb.questionId} qb={qb} index={i} formType={form.type} />
              ))}
            </div>

            {/* Recent responses */}
            {a.recentResponses?.length > 0 && (
              <div className="card" style={{ padding: '20px 22px', marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Submissions</h3>
                  <Link to={`/forms/${id}/responses`} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View All</Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Respondent', form.type === 'quiz' ? 'Score' : 'Status', 'Submitted'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {a.recentResponses.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.respondentName}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {form.type === 'quiz' && r.percentage !== null ? (
                              <span style={{
                                fontWeight: 700, color: r.percentage >= 60 ? '#10b981' : '#ef4444'
                              }}>{r.percentage}%</span>
                            ) : (
                              <span className="badge badge-success">Submitted</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                            {new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuestionAnalyticsCard({ qb, index, formType }) {
  const { question, type, responseCount, breakdown, correctCount } = qb;

  const renderChart = () => {
    if (breakdown.type === 'text') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(breakdown.responses || []).slice(0, 5).map((r, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
              {r || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No answer</span>}
            </div>
          ))}
          {breakdown.responses?.length > 5 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>+{breakdown.responses.length - 5} more responses</p>
          )}
        </div>
      );
    }

    if (breakdown.type === 'rating') {
      const labels = Object.keys(breakdown.data).map(k => `★ ${k}`);
      return (
        <div>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', marginBottom: 12 }}>
            {breakdown.avg} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/ {Math.max(...Object.keys(breakdown.data).map(Number))} avg</span>
          </p>
          <div style={{ height: 140 }}>
            <Bar
              data={{
                labels,
                datasets: [{ data: Object.values(breakdown.data), backgroundColor: CHART_COLORS.map(c => `${c}bb`), borderRadius: 4 }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }}
            />
          </div>
        </div>
      );
    }

    const labels = Object.keys(breakdown.data || {});
    const values = Object.values(breakdown.data || {});
    const total = values.reduce((s, v) => s + v, 0);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
        <div style={{ height: 180 }}>
          <Doughnut
            data={{
              labels,
              datasets: [{ data: values, backgroundColor: CHART_COLORS.map(c => `${c}cc`), borderColor: CHART_COLORS, borderWidth: 2 }]
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {labels.map((l, i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</span>
              <span style={{ fontWeight: 700 }}>{values[i]}</span>
              <span style={{ color: 'var(--text-muted)' }}>({total > 0 ? Math.round((values[i] / total) * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ background: 'var(--primary)', color: 'white', width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {index + 1}
          </span>
          <p style={{ fontWeight: 600, fontSize: 15 }}>{question}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-primary">{responseCount} responses</span>
          {formType === 'quiz' && correctCount !== undefined && (
            <span className="badge badge-success">
              {responseCount > 0 ? Math.round((correctCount / responseCount) * 100) : 0}% correct
            </span>
          )}
        </div>
      </div>
      {renderChart()}
    </div>
  );
}
