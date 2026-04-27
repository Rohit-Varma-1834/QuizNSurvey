// Shows charts and analytics for a selected form.
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { PageLoader } from '../components/ui/Common';
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const CHART_COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#cbd5e1', '#475569', '#0f172a'];

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const baseChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      borderWidth: 1,
      padding: 12,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
      ticks: { stepSize: 1, color: '#64748b' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' }
    }
  }
};

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
    setError('');
    try {
      const { data } = await api.get(`/api/analytics/form/${id}`);
      setAnalytics(data.analytics);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
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

  const handleAnalyzeSentiment = async () => {
    if (!analytics) return;
    const hasTextResponses = analytics.form.type === 'survey' && (analytics.questionBreakdown || []).some((qb) => (
      ['short_answer', 'paragraph'].includes(qb.type) && qb.responseCount > 0
    ));

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
    if (!analytics) return;
    setPdfExporting(true);
    try {
      const response = await api.get(`/api/analytics/form/${id}/report.pdf`, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] || `${analytics.form.title || 'analytics'}-report.pdf`;
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

  if (loading) return <><Navbar /><PageLoader /></>;

  if (error) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="section-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h2 style={{ marginBottom: 8 }}>Analytics unavailable</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
            <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
          </div>
        </div>
      </>
    );
  }

  const a = analytics;
  const form = a.form;
  const passCount = a.passFailCounts?.passed ?? 0;
  const failCount = a.passFailCounts?.failed ?? 0;
  const hasTextResponses = form.type === 'survey' && (a.questionBreakdown || []).some((qb) => (
    ['short_answer', 'paragraph'].includes(qb.type) && qb.responseCount > 0
  ));
  const secondaryChartTitle = form.type === 'quiz' ? 'Score Distribution' : 'Most Selected Answers';

  const lineData = {
    labels: (a.dailyResponses || []).map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Responses',
      data: (a.dailyResponses || []).map(d => d.count),
      fill: true,
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      borderColor: '#2563eb',
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 4,
      pointBackgroundColor: '#2563eb',
    }]
  };

  const metrics = [
    { label: 'Total Responses', value: a.totalResponses, helper: `${a.questionBreakdown?.length || 0} questions` },
    ...(form.type === 'quiz' && a.avgPercentage !== null
      ? [{ label: 'Average Score', value: `${a.avgPercentage}%`, helper: a.avgScore !== null ? `${a.avgScore} average points` : 'Quiz performance' }]
      : [{ label: 'Completion', value: `${a.totalResponses}`, helper: 'Submitted responses' }]),
    ...(a.passRate !== null ? [{ label: 'Pass Rate', value: `${a.passRate}%`, helper: `${passCount} passed / ${failCount} failed` }] : []),
    ...(a.avgTime ? [{ label: 'Average Time', value: formatDuration(a.avgTime), helper: 'Time to submit' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div className="page-container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px', marginTop: 2 }}>
              <HiOutlineArrowLeft size={16} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 28, marginBottom: 6 }}>{form.title}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {form.type} · {form.status} · Review performance, answer patterns, and AI-generated insights.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={fetchAnalytics} className="btn btn-ghost btn-sm">
              <HiOutlineRefresh size={15} /> Refresh
            </button>
            <button onClick={handleExportPdf} className="btn btn-secondary btn-sm" disabled={pdfExporting}>
              {pdfExporting ? 'Exporting…' : 'Export PDF'}
            </button>
            <Link to={`/forms/${id}/responses`} className="btn btn-primary btn-sm">
              <HiOutlineEye size={15} /> View Responses
            </Link>
          </div>
        </div>

        {a.totalResponses === 0 ? (
          <div className="section-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <h2 style={{ marginBottom: 8 }}>No responses yet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 520, margin: '0 auto 20px' }}>
              Share this form to start collecting responses. Once submissions come in, this page will show trend data, question-level insights, and AI summaries.
            </p>
            <Link to={`/forms/${id}/responses`} className="btn btn-secondary">View Responses</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              {metrics.map((metric) => (
                <OverviewMetric
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                />
              ))}
            </div>

            <div className="section-card" style={{ marginBottom: 24, background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.01) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 6 }}>AI Insights</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Generate concise summaries and sentiment analysis from collected responses.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={handleGenerateSummary} className="btn btn-secondary btn-sm" disabled={summaryLoading || a.totalResponses === 0}>
                    {summaryLoading ? 'Generating…' : aiSummary ? 'Regenerate Summary' : 'Generate AI Summary'}
                  </button>
                  {form.type === 'survey' && (
                    <button onClick={handleAnalyzeSentiment} className="btn btn-secondary btn-sm" disabled={sentimentLoading || !hasTextResponses}>
                      {sentimentLoading ? 'Analyzing…' : sentiment ? 'Refresh Sentiment' : 'Analyze Sentiment'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {aiSummary ? (
                  <AiSummaryCard summary={aiSummary} />
                ) : (
                  <InsightPlaceholder
                    title="AI Response Summary"
                    description={a.totalResponses === 0
                      ? 'Responses are needed before a summary can be generated.'
                      : 'Generate a concise recap of key trends, positive feedback, issues, and suggested actions.'}
                  />
                )}

                {form.type === 'survey' && (
                  sentiment ? (
                    <SentimentCard sentiment={sentiment} />
                  ) : (
                    <InsightPlaceholder
                      title="Survey Sentiment"
                      description={hasTextResponses
                        ? 'Analyze short-answer and paragraph responses to see positive, neutral, and negative sentiment.'
                        : 'Text-based survey answers are required before sentiment analysis is available.'}
                    />
                  )
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, marginBottom: 6 }}>Charts</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Review response volume and answer patterns across the form.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
              <ChartSectionCard
                title="Response Trend"
                subtitle="Response count over the last 30 days"
              >
                {a.dailyResponses?.length > 0 ? (
                  <div style={{ height: 240 }}>
                    <Line data={lineData} options={{ ...baseChartOptions, maintainAspectRatio: false }} />
                  </div>
                ) : (
                  <CardEmptyText text="No response trend data available yet." />
                )}
              </ChartSectionCard>

              <ChartSectionCard
                title={secondaryChartTitle}
                subtitle={form.type === 'quiz'
                  ? 'How respondents are distributed across score ranges'
                  : 'The answers respondents selected most often'}
              >
                {form.type === 'quiz' ? (
                  a.scoreDistribution ? (
                    <div style={{ height: 240 }}>
                      <Bar
                        data={{
                          labels: Object.keys(a.scoreDistribution),
                          datasets: [{
                            label: 'Respondents',
                            data: Object.values(a.scoreDistribution),
                            backgroundColor: CHART_COLORS[0],
                            borderRadius: 8,
                            maxBarThickness: 48,
                          }]
                        }}
                        options={{ ...baseChartOptions, maintainAspectRatio: false }}
                      />
                    </div>
                  ) : (
                    <CardEmptyText text="No score distribution is available yet." />
                  )
                ) : (
                  a.topSelections?.length > 0 ? (
                    <SelectionList items={a.topSelections} />
                  ) : (
                    <CardEmptyText text="No answer selection patterns are available yet." />
                  )
                )}
              </ChartSectionCard>
            </div>

            {form.type === 'quiz' && a.topSelections?.length > 0 && (
              <ChartSectionCard
                title="Most Selected Answers"
                subtitle="Answer options that appear most often across the form"
                style={{ marginBottom: 24 }}
              >
                <SelectionList items={a.topSelections} compact={false} />
              </ChartSectionCard>
            )}

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, marginBottom: 6 }}>Question-Level Insights</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Review response rate, top answer patterns, and one-line takeaways for each question.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(a.questionBreakdown || []).map((qb, i) => (
                <QuestionAnalyticsCard key={qb.questionId} qb={qb} index={i} formType={form.type} />
              ))}
            </div>

            {a.recentResponses?.length > 0 && (
              <div className="section-card" style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Recent Submissions</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>A quick view of the latest respondents.</p>
                  </div>
                  <Link to={`/forms/${id}/responses`} className="btn btn-ghost btn-sm">View All</Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Respondent', form.type === 'quiz' ? 'Score' : 'Status', 'Submitted'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {a.recentResponses.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 500 }}>{r.respondentName}</td>
                          <td style={{ padding: '12px' }}>
                            {form.type === 'quiz' && r.percentage !== null ? (
                              <span style={{ fontWeight: 700, color: r.percentage >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                                {r.percentage}%
                              </span>
                            ) : (
                              <span className="badge badge-success">Submitted</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
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

function OverviewMetric({ label, value, helper }) {
  return (
    <div className="section-card" style={{ padding: '18px 20px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        {label}
      </p>
      <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {helper}
      </p>
    </div>
  );
}

function ChartSectionCard({ title, subtitle, children, style = {} }) {
  return (
    <div className="section-card" style={style}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function CardEmptyText({ text }) {
  return (
    <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
      {text}
    </div>
  );
}

function SelectionList({ items, compact = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item) => (
        <div key={`${item.questionId}-${item.answer}`} style={{ padding: compact ? '12px 14px' : '14px 16px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.question}</p>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.answer}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            Selected {item.count} time{item.count === 1 ? '' : 's'} ({item.percentage}%)
          </p>
        </div>
      ))}
    </div>
  );
}

function InsightPlaceholder({ title, description }) {
  return (
    <div style={{
      padding: '18px 20px',
      borderRadius: 14,
      border: '1px solid rgba(37, 99, 235, 0.14)',
      background: 'rgba(37, 99, 235, 0.04)'
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

function AiSummaryCard({ summary }) {
  return (
    <div style={{
      padding: '18px 20px',
      borderRadius: 14,
      border: '1px solid rgba(37, 99, 235, 0.16)',
      background: 'rgba(37, 99, 235, 0.05)'
    }}>
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
      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div key={item} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(37, 99, 235, 0.08)', fontSize: 13 }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentCard({ sentiment }) {
  const segments = [
    { key: 'positive', label: 'Positive', percentage: sentiment.positivePercentage, count: sentiment.positiveCount, color: 'var(--success)' },
    { key: 'neutral', label: 'Neutral', percentage: sentiment.neutralPercentage, count: sentiment.neutralCount, color: 'var(--text-secondary)' },
    { key: 'negative', label: 'Negative', percentage: sentiment.negativePercentage, count: sentiment.negativeCount, color: 'var(--danger)' },
  ];

  return (
    <div style={{
      padding: '18px 20px',
      borderRadius: 14,
      border: '1px solid rgba(37, 99, 235, 0.16)',
      background: 'rgba(37, 99, 235, 0.05)'
    }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Survey Sentiment</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Based on {sentiment.analyzedResponseCount} text response{sentiment.analyzedResponseCount === 1 ? '' : 's'}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {segments.map((segment) => (
          <div key={segment.key} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(37, 99, 235, 0.08)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{segment.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: segment.color, marginBottom: 4 }}>{segment.percentage}%</p>
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
  const { question, responseCount, responseRate, breakdown, correctCount, insight, topAnswer } = qb;

  const renderBreakdown = () => {
    if (breakdown.type === 'text') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(breakdown.responses || []).slice(0, 4).map((r, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}>
              {r || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No answer</span>}
            </div>
          ))}
          {breakdown.responses?.length > 4 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{breakdown.responses.length - 4} more responses</p>
          )}
        </div>
      );
    }

    if (breakdown.type === 'rating') {
      const labels = Object.keys(breakdown.data).map(k => `${k}`);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
              {breakdown.avg}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Average rating
            </p>
          </div>
          <div style={{ height: 160 }}>
            <Bar
              data={{
                labels,
                datasets: [{ data: Object.values(breakdown.data), backgroundColor: CHART_COLORS[1], borderRadius: 6 }]
              }}
              options={{ ...baseChartOptions, maintainAspectRatio: false }}
            />
          </div>
        </div>
      );
    }

    const labels = Object.keys(breakdown.data || {});
    const values = Object.values(breakdown.data || {});
    const total = values.reduce((sum, value) => sum + value, 0);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 1fr', gap: 20, alignItems: 'center' }}>
        <div style={{ height: 180 }}>
          <Doughnut
            data={{
              labels,
              datasets: [{ data: values, backgroundColor: CHART_COLORS.slice(0, Math.max(labels.length, 1)), borderWidth: 0 }]
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {labels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: 9999, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              <span style={{ fontWeight: 700 }}>{values[i]}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                ({total > 0 ? Math.round((values[i] / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="section-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
          <span style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            width: 30,
            height: 30,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0
          }}>
            {index + 1}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{question}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-secondary">{responseCount} responses</span>
              <span className="badge badge-secondary">{responseRate}% response rate</span>
              {formType === 'quiz' && correctCount !== undefined && (
                <span className="badge badge-primary">
                  {responseCount > 0 ? Math.round((correctCount / responseCount) * 100) : 0}% correct
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {(insight || topAnswer) && (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: 16 }}>
          {topAnswer && (
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: insight ? 6 : 0 }}>
              Top answer: {topAnswer.answer} ({topAnswer.percentage}%)
            </p>
          )}
          {insight && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              {insight}
            </p>
          )}
        </div>
      )}

      {renderBreakdown()}
    </div>
  );
}
