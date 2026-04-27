// Shows charts and analytics for a selected form.
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
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const CHART_COLORS = ['#161a1d', '#660708', '#a4161a', '#ba181b', '#e5383b', '#b1a7a6', '#d3d3d3', '#f5f3f4'];

export default function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/analytics/form/${id}`);
      setAnalytics(data.analytics);
    } catch { setError('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, [id]);

  const handleGenerateSummary = async () => {
    if (!analytics?.totalResponses) {
      toast.error('This form has no responses to summarize yet');
      return;
    }

    setSummaryLoading(true);
    try {
      const { data } = await api.post(`/api/ai/summarize-responses/${id}`);
      setAiSummary(data.summary);
      toast.success('AI summary generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) return <><Navbar /><PageLoader /></>;
  if (error) return <><Navbar /><div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--danger)' }}>{error}</p><Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>Back</Link></div></>;

  const a = analytics;
  const form = a.form;
  const passCount = a.passFailCounts?.passed ?? 0;
  const failCount = a.passFailCounts?.failed ?? 0;
  const hasTextResponses = form.type === 'survey' && (a.questionBreakdown || []).some((qb) => (
    ['short_answer', 'paragraph'].includes(qb.type) && qb.responseCount > 0
  ));

  const handleAnalyzeSentiment = async () => {
    if (!hasTextResponses) {
      toast.error('This survey has no text responses to analyze yet');
      return;
    }

    setSentimentLoading(true);
    try {
      const { data } = await api.post(`/api/ai/sentiment/${id}`);
      setSentiment(data.sentiment);
      toast.success('Sentiment analysis generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze sentiment');
    } finally {
      setSentimentLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setPdfExporting(true);
    try {
      const response = await api.get(`/api/analytics/form/${id}/report.pdf`, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] || `${form.title || 'analytics'}-report.pdf`;
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('PDF report downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export PDF report');
    } finally {
      setPdfExporting(false);
    }
  };

  // Daily responses chart
  const lineData = {
    labels: (a.dailyResponses || []).map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Responses',
      data: (a.dailyResponses || []).map(d => d.count),
      fill: true,
      backgroundColor: 'rgba(186,24,27,0.12)',
      borderColor: '#ba181b',
      borderWidth: 2.5,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ba181b',
    }]
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(43,45,66,0.08)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
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
          <button onClick={handleExportPdf} className="btn btn-secondary btn-sm" disabled={pdfExporting}>
            {pdfExporting ? 'Exporting…' : 'Export PDF Report'}
          </button>
          <button onClick={handleGenerateSummary} className="btn btn-secondary btn-sm" disabled={summaryLoading || a.totalResponses === 0}>
            {summaryLoading ? 'Generating…' : 'Generate AI Summary'}
          </button>
          {form.type === 'survey' && (
            <button onClick={handleAnalyzeSentiment} className="btn btn-secondary btn-sm" disabled={sentimentLoading || !hasTextResponses}>
              {sentimentLoading ? 'Analyzing…' : 'Analyze Sentiment'}
            </button>
          )}
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
            {aiSummary && (
              <AiSummaryCard summary={aiSummary} />
            )}

            {form.type === 'survey' && (
              sentiment ? (
                <SentimentCard sentiment={sentiment} />
              ) : !hasTextResponses ? (
                <div className="card" style={{ padding: '18px 20px', marginBottom: 24, borderLeft: '4px solid var(--border)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Survey Sentiment</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    No text-based responses are available yet. Sentiment analysis needs short-answer or paragraph responses.
                  </p>
                </div>
              ) : null
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Responses" value={a.totalResponses} icon="📋" color="var(--secondary)" />
              <StatCard label="Questions" value={a.questionBreakdown?.length || 0} icon="❓" color="var(--primary-dark)" />
              {form.type === 'quiz' && a.avgPercentage !== null && (
                <StatCard label="Avg Score" value={`${a.avgPercentage}%`} icon="🎯" color="var(--primary)" />
              )}
              {form.type === 'quiz' && a.avgScore !== null && (
                <StatCard label="Avg Points" value={a.avgScore} icon="⭐" color="var(--accent)" />
              )}
              {a.passRate !== null && (
                <StatCard label="Pass Rate" value={`${a.passRate}%`} icon="✅" color="var(--accent)" />
              )}
              {form.type === 'quiz' && a.passFailCounts && (
                <StatCard label="Pass / Fail" value={`${passCount}/${failCount}`} icon="🏁" color="var(--secondary)" />
              )}
              {a.avgTime && (
                <StatCard label="Avg Time" value={`${Math.floor(a.avgTime / 60)}m ${a.avgTime % 60}s`} icon="⏱" color="var(--primary-dark)" />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
              {/* Response Trend */}
              {a.dailyResponses?.length > 0 && (
                <div className="card" style={{ padding: '20px 22px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>📈 Response Trend</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
                    Response count over the last 30 days
                  </p>
                  <div style={{ height: 220 }}>
                    <Line data={lineData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                  </div>
                </div>
              )}

              {a.topSelections?.length > 0 && (
                <div className="card" style={{ padding: '20px 22px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🔥 Most Selected Answers</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
                    The answers respondents picked most often
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {a.topSelections.map((item) => (
                      <div key={`${item.questionId}-${item.answer}`} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.question}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.answer}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                          Selected {item.count} time{item.count === 1 ? '' : 's'} ({item.percentage}%)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Score distribution for quizzes */}
            {form.type === 'quiz' && a.scoreDistribution && (
              <div className="card" style={{ padding: '20px 22px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🏆 Score Distribution</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
                  How respondents are spread across score ranges
                </p>
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
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Question-Level Insights</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                See response volume, strongest answer patterns, and quick takeaways for each question.
              </p>
            </div>
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
                                fontWeight: 700, color: r.percentage >= 60 ? 'var(--secondary)' : 'var(--danger)'
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

function AiSummaryCard({ summary }) {
  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 24, borderLeft: '4px solid var(--primary)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>AI Response Summary</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        {summary.overallSummary}
      </p>
      <SummaryList title="Key Trends" items={summary.keyTrends} />
      <SummaryList title="Common Positive Feedback" items={summary.positiveFeedback} />
      <SummaryList title="Common Issues" items={summary.negativeFeedback} />
      <SummaryList title="Suggested Actions" items={summary.suggestedActions} />
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

function SentimentCard({ sentiment }) {
  const segments = [
    { key: 'positive', label: 'Positive', percentage: sentiment.positivePercentage, count: sentiment.positiveCount, color: 'var(--secondary)' },
    { key: 'neutral', label: 'Neutral', percentage: sentiment.neutralPercentage, count: sentiment.neutralCount, color: 'var(--text-secondary)' },
    { key: 'negative', label: 'Negative', percentage: sentiment.negativePercentage, count: sentiment.negativeCount, color: 'var(--danger)' },
  ];

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 24, borderLeft: '4px solid var(--secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Survey Sentiment</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Based on {sentiment.analyzedResponseCount} text response{sentiment.analyzedResponseCount === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
        {segments.map((segment) => (
          <div key={segment.key} style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--bg-secondary)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{segment.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: segment.color, marginBottom: 4 }}>{segment.percentage}%</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{segment.count} response{segment.count === 1 ? '' : 's'}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        {sentiment.explanation}
      </p>
    </div>
  );
}

function QuestionAnalyticsCard({ qb, index, formType }) {
  const { question, type, responseCount, responseRate, breakdown, correctCount, insight, topAnswer } = qb;

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, alignItems: 'center' }}>
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
          <span className="badge badge-secondary">{responseRate}% response rate</span>
          {formType === 'quiz' && correctCount !== undefined && (
            <span className="badge badge-success">
              {responseCount > 0 ? Math.round((correctCount / responseCount) * 100) : 0}% correct
            </span>
          )}
        </div>
      </div>
      {(insight || topAnswer) && (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-secondary)', marginBottom: 16 }}>
          {insight && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: topAnswer ? 6 : 0 }}>
              {insight}
            </p>
          )}
          {topAnswer && (
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
              Top answer: {topAnswer.answer} ({topAnswer.percentage}%)
            </p>
          )}
        </div>
      )}
      {renderChart()}
    </div>
  );
}
