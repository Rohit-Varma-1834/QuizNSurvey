// Shows the public home page and product overview.
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const OVERVIEW_ITEMS = [
  {
    title: 'AI question generation',
    description: 'Generate quiz or survey questions from a prompt, then review and edit them before publishing.',
  },
  {
    title: 'Public links and QR sharing',
    description: 'Publish a form once and collect responses from a public link or QR code without requiring creator login.',
  },
  {
    title: 'Analytics and exports',
    description: 'Track responses, review charts, export CSV data, and download PDF analytics reports.',
  },
  {
    title: 'Privacy and feedback tools',
    description: 'Support anonymous survey responses, AI summaries, and sentiment analysis for text feedback.',
  },
];

const FEATURE_CARDS = [
  {
    title: 'Create with AI',
    description: 'Start from a prompt and turn it into editable questions inside the builder.',
  },
  {
    title: 'Share publicly',
    description: 'Use a public link or QR code so respondents can submit without extra friction.',
  },
  {
    title: 'Review insights',
    description: 'See response trends, pass rates, question breakdowns, and AI-generated summaries.',
  },
  {
    title: 'Export results',
    description: 'Download CSV response data and PDF reports for analysis, presentation, or record keeping.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main>
        <section style={{ padding: '72px 0 56px' }}>
          <div className="page-container" style={{ display: 'grid', gap: 40 }}>
            <div style={{ maxWidth: 760 }}>
              <p style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderRadius: '9999px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 18
              }}>
                QuiznSurvey
              </p>

              <h1 style={{ maxWidth: 720, marginBottom: 16 }}>
                Create quizzes and surveys with AI-powered insights.
              </h1>

              <p style={{
                maxWidth: 720,
                fontSize: 16,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                marginBottom: 28
              }}>
                Build forms, collect public responses, and analyze results with summaries,
                sentiment, exports, and dashboards.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Building
                </Link>
                <a
                  href="#product-overview"
                  className="btn btn-ghost btn-lg"
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                >
                  View Product Overview
                </a>
              </div>
            </div>

            <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 4 }}>Product dashboard preview</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Form management, responses, analytics, exports, and AI tools in one workspace.
                  </p>
                </div>
                <span className="badge badge-secondary">Preview</span>
              </div>

              <div style={{ padding: 24, background: 'var(--bg-secondary)' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-strong)' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{
                      marginLeft: 8,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontSize: 12
                    }}>
                      Dashboard
                    </div>
                  </div>

                  <div style={{
                    padding: 24,
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: 18
                  }}>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                        {['Forms', 'Responses', 'Analytics'].map((label) => (
                          <div key={label} style={{
                            padding: '18px 16px',
                            borderRadius: 14,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)'
                          }}>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
                            <div style={{ width: '70%', height: 12, borderRadius: 9999, background: 'var(--bg-secondary)', marginBottom: 8 }} />
                            <div style={{ width: '45%', height: 8, borderRadius: 9999, background: 'var(--border)' }} />
                          </div>
                        ))}
                      </div>

                      <div style={{
                        padding: 18,
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)'
                      }}>
                        <div style={{ width: 180, height: 14, borderRadius: 9999, background: 'var(--bg-secondary)', marginBottom: 18 }} />
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minHeight: 160 }}>
                          {[52, 84, 62, 94, 76, 108, 88].map((height, index) => (
                            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: '100%',
                                maxWidth: 28,
                                height,
                                borderRadius: 9999,
                                background: index === 5 ? 'var(--primary)' : 'var(--border)'
                              }} />
                              <div style={{ width: 20, height: 8, borderRadius: 9999, background: 'var(--bg-secondary)' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 14 }}>
                      <div style={{
                        padding: 18,
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)'
                      }}>
                        <div style={{ width: 120, height: 14, borderRadius: 9999, background: 'var(--bg-secondary)', marginBottom: 14 }} />
                        <div style={{ display: 'grid', gap: 10 }}>
                          {[1, 2, 3].map((item) => (
                            <div key={item} style={{
                              padding: '10px 12px',
                              borderRadius: 12,
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border)'
                            }}>
                              <div style={{ width: '85%', height: 10, borderRadius: 9999, background: 'var(--border-strong)', marginBottom: 8 }} />
                              <div style={{ width: '55%', height: 8, borderRadius: 9999, background: 'var(--border)' }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        padding: 18,
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)'
                      }}>
                        <div style={{ width: 110, height: 14, borderRadius: 9999, background: 'var(--bg-secondary)', marginBottom: 14 }} />
                        <div style={{ display: 'grid', gap: 10 }}>
                          {[72, 54, 88].map((width, index) => (
                            <div key={index}>
                              <div style={{ width: `${width}%`, height: 10, borderRadius: 9999, background: index === 2 ? 'var(--primary)' : 'var(--border)' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product-overview" style={{ padding: '8px 0 24px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 720, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>Product overview</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                QuiznSurvey helps creators build forms, collect responses through public links,
                and review the results with practical analytics and AI-assisted summaries.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {OVERVIEW_ITEMS.map((item) => (
                <div key={item.title} className="section-card">
                  <h3 style={{ marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '24px 0 48px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 680, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>Core features</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The platform focuses on the full workflow: authoring, publishing, collecting,
                reviewing, and exporting results.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {FEATURE_CARDS.map((feature) => (
                <div key={feature.title} className="section-card">
                  <h3 style={{ marginBottom: 8 }}>{feature.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 80px' }}>
          <div className="page-container">
            <div className="section-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <h2 style={{ marginBottom: 12 }}>Start building your first AI-powered form.</h2>
              <p style={{ maxWidth: 620, margin: '0 auto 24px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Create a quiz or survey, publish it with a public link, and review the results from one dashboard.
              </p>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
