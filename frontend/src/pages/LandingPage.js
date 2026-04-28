// Shows the public home page and product overview.
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const coreFeatures = [
  {
    title: 'Form Builder',
    description: 'Create quizzes and surveys with flexible question types and a clean editing flow.'
  },
  {
    title: 'Public Links & QR Codes',
    description: 'Share forms using public links or QR codes so respondents can submit without logging in.'
  },
  {
    title: 'Analytics Dashboard',
    description: 'Review responses, scores, charts, question-level performance, and response trends.'
  },
  {
    title: 'CSV & PDF Export',
    description: 'Download response data and summary reports for records, presentations, or sharing.'
  }
];

const aiFeatures = [
  {
    title: 'AI Question Generator',
    description: 'Generate editable quiz or survey questions from a simple prompt.'
  },
  {
    title: 'AI Response Summary',
    description: 'Summarize collected responses into clear insights.'
  },
  {
    title: 'Sentiment Analysis',
    description: 'Understand the overall tone of written feedback.'
  }
];

const howItWorks = [
  {
    step: '1. Create',
    description: 'Build manually or generate questions with AI.'
  },
  {
    step: '2. Share',
    description: 'Publish your form and send a public link or QR code.'
  },
  {
    step: '3. Analyze',
    description: 'Use dashboards, exports, summaries, and sentiment insights to understand results.'
  }
];

const useCases = [
  'Classroom quizzes',
  'Student projects',
  'Customer feedback',
  'Team surveys',
  'Research surveys',
  'Event feedback'
];

const trustItems = [
  'Public forms work without respondent login',
  'Creator dashboard is protected',
  'Supports anonymous response collection',
  'CSV and PDF exports included',
  'AI features are assistive and editable'
];

const previewColumns = [
  {
    title: 'Build',
    description: 'Create a quiz or survey, edit questions, and generate drafts with AI.'
  },
  {
    title: 'Share',
    description: 'Publish once, then send a public link or QR code for frictionless responses.'
  },
  {
    title: 'Analyze',
    description: 'Review submissions, export data, and use summaries or sentiment tools to understand results.'
  }
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main>
        <section style={{ padding: '72px 0 56px' }}>
          <div className="page-container landing-hero-grid">
            <div style={{ maxWidth: 720 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 14
                }}
              >
                AI-powered form creation and analytics
              </p>

              <h1 style={{ maxWidth: 760, marginBottom: 16 }}>
                Create quizzes and surveys with built-in AI analysis.
              </h1>

              <p
                style={{
                  maxWidth: 720,
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: 'var(--text-secondary)',
                  marginBottom: 28
                }}
              >
                Build forms, share them publicly, collect responses, and review results with dashboards,
                exports, summaries, and sentiment insights.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Building
                </Link>
                <a href="#product-preview" className="btn btn-secondary btn-lg">
                  View Demo
                </a>
              </div>
            </div>

            <div className="section-card" style={{ padding: '22px 24px' }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 12
                }}
              >
                Product highlights
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  'AI-assisted question generation inside the builder',
                  'Public response links with optional anonymous mode',
                  'Response review, exports, and PDF reporting',
                  'Analytics, summaries, and sentiment insights'
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--bg-card)'
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="product-preview" style={{ padding: '0 0 48px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 720, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>Product preview</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                A quick look at the real workflow: create forms, publish public links, and review analytics from one workspace.
              </p>
            </div>

            <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h3 style={{ marginBottom: 4 }}>Product tour</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    This preview uses real product areas and feature names only.
                  </p>
                </div>
                <span className="badge badge-secondary">Builder · Responses · Analytics</span>
              </div>

              <div className="landing-preview-grid" style={{ padding: 24 }}>
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-card)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <strong style={{ fontSize: 14 }}>Workspace</strong>
                  </div>

                  <div style={{ display: 'grid', gap: 12, padding: 18 }}>
                    {[
                      'Dashboard overview',
                      'AI question generator',
                      'Public share link and QR code',
                      'Responses review workspace',
                      'Analytics and exports'
                    ].map((item) => (
                      <div
                        key={item}
                        style={{
                          padding: '12px 14px',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          background: 'var(--bg-card)'
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  {previewColumns.map((column) => (
                    <div key={column.title} className="section-card" style={{ padding: '18px 20px' }}>
                      <h3 style={{ marginBottom: 8 }}>{column.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {column.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" style={{ padding: '8px 0 40px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 720, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>Core features</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                QuiznSurvey covers the full flow from creation to response collection and reporting.
              </p>
            </div>

            <div className="landing-grid-4">
              {coreFeatures.map((feature) => (
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

        <section id="ai" style={{ padding: '8px 0 40px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 720, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>AI features</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                AI supports the workflow without taking control away from the creator. Generated content stays editable before publishing.
              </p>
            </div>

            <div className="landing-grid-3">
              {aiFeatures.map((feature) => (
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

        <section id="how-it-works" style={{ padding: '8px 0 40px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 720, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>How it works</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The workflow stays simple from form creation to response analysis.
              </p>
            </div>

            <div className="landing-grid-3">
              {howItWorks.map((item) => (
                <div key={item.step} className="section-card">
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    {item.step}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="use-cases" style={{ padding: '8px 0 40px' }}>
          <div className="page-container">
            <div style={{ maxWidth: 720, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 10 }}>Use cases</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The product is useful for classrooms, research, internal feedback, and public response collection.
              </p>
            </div>

            <div className="landing-use-case-grid">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="section-card"
                  style={{ padding: '16px 18px', fontWeight: 600 }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '8px 0 56px' }}>
          <div className="page-container">
            <div className="section-card">
              <div style={{ maxWidth: 720, marginBottom: 22 }}>
                <h2 style={{ marginBottom: 10 }}>Built for practical product use</h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  The core product is designed around public response collection, protected creator workflows, and exportable results.
                </p>
              </div>

              <div className="landing-grid-3">
                {trustItems.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: '14px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 48px' }}>
          <div className="page-container">
            <div className="section-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <h2 style={{ marginBottom: 12 }}>Start building your first AI-powered form.</h2>
              <p style={{ maxWidth: 620, margin: '0 auto 24px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Create a quiz or survey, publish it with a public link, and review the results from one dashboard.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Building
                </Link>
                <a href="#product-preview" className="btn btn-secondary btn-lg">
                  View Demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="page-container landing-footer-grid" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              Quizn<span style={{ color: 'var(--primary)' }}>Survey</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.7 }}>
              A full-stack product for building quizzes and surveys, collecting responses, and reviewing results with analytics and AI tools.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="#features" style={{ color: 'var(--text-secondary)' }}>Features</a>
            <a href="#ai" style={{ color: 'var(--text-secondary)' }}>AI</a>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)' }}>How It Works</a>
            <a href="#use-cases" style={{ color: 'var(--text-secondary)' }}>Use Cases</a>
            <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Login</Link>
            <Link to="/register" style={{ color: 'var(--text-secondary)' }}>Start Building</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}