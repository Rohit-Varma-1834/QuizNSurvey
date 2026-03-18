import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const FEATURES = [
  { icon: '🧠', title: 'Smart Quizzes', desc: 'Create auto-graded quizzes with multiple question types, timers, and instant scoring.' },
  { icon: '📊', title: 'Surveys & Polls', desc: 'Collect feedback and opinions with beautiful, easy-to-fill survey forms.' },
  { icon: '📱', title: 'QR Code Sharing', desc: 'Generate QR codes instantly. Let anyone scan and respond from their phone.' },
  { icon: '📈', title: 'Real-time Analytics', desc: 'Visualize responses with interactive charts, breakdowns, and score distributions.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'JWT auth, protected dashboards, and optional anonymous responses for surveys.' },
  { icon: '⚡', title: 'Instant Results', desc: 'Quiz takers see their score immediately after submitting. No waiting.' },
];

const STEPS = [
  { n: '01', title: 'Create your form', desc: 'Choose quiz or survey, add questions with our drag-and-drop builder.' },
  { n: '02', title: 'Publish & Share', desc: 'Get a public link and QR code. Share via email, social, or print the QR code.' },
  { n: '03', title: 'Collect Responses', desc: 'Participants answer on any device — desktop or mobile.' },
  { n: '04', title: 'Analyze Results', desc: 'View detailed analytics, charts, and individual responses on your dashboard.' },
];

const TESTIMONIALS = [
  { name: 'Sarah Mitchell', role: 'High School Teacher', avatar: '👩‍🏫', text: 'QuiznSurvey transformed how I assess my students. The QR code feature means they just scan and go — no login needed!' },
  { name: 'James Okonkwo', role: 'Event Organizer', avatar: '🎯', text: 'I use it for event feedback forms. The analytics dashboard gives me exactly what I need to improve future events.' },
  { name: 'Dr. Priya Sharma', role: 'UX Researcher', avatar: '🔬', text: 'Anonymous survey mode and the question breakdown charts make it perfect for user research. Highly recommended.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        padding: '80px 24px 100px',
        background: 'linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: -100, left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 28,
            boxShadow: 'var(--shadow-sm)', fontSize: 13, fontWeight: 600, color: 'var(--primary)'
          }}>
            <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '1px 8px', fontSize: 11 }}>NEW</span>
            QR Code sharing now available 🎉
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800, lineHeight: 1.1,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #bc7272 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Create Quizzes & Surveys<br />That People Love
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Build beautiful quizzes and surveys in minutes. Share via link or QR code.
            Analyze responses with real-time insights.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-xl" style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              Start for Free →
            </Link>
            <Link to="/login" className="btn btn-secondary btn-xl">
              Sign In
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            No credit card required · Free forever plan
          </p>
        </div>

        {/* Mock dashboard preview */}
        <div style={{
          maxWidth: 900, margin: '60px auto 0',
          background: 'var(--bg-card)', borderRadius: 20,
          border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
          overflow: 'hidden', animation: 'fadeInUp 0.8s ease'
        }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', display: 'flex', gap: 6 }}>
            {['#ef4444', '#f59e0b', '#10b981'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
            <div style={{ flex: 1, background: 'var(--border)', borderRadius: 6, height: 10, marginLeft: 8, maxWidth: 200 }} />
          </div>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Total Forms', value: '24', color: '#6366f1' },
              { label: 'Responses', value: '1,847', color: '#10b981' },
              { label: 'Avg Score', value: '78%', color: '#f59e0b' },
              { label: 'Published', value: '18', color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 14 }}>Everything you need to collect insights</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
              From classroom quizzes to enterprise surveys — one platform handles it all.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ padding: 24, animation: `fadeInUp ${0.3 + i * 0.1}s ease` }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 14 }}>Up and running in minutes</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'white'
                }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 52 }}>Loved by teachers, researchers & businesses</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'white', marginBottom: 16 }}>
          Ready to start collecting insights?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, marginBottom: 36 }}>
          Join thousands of creators who trust QuiznSurvey.
        </p>
        <Link to="/register" className="btn btn-xl" style={{ background: 'white', color: '#4f46e5', fontWeight: 700, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          Create Your First Form — Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', background: '#0f172a', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          © {new Date().getFullYear()} QuiznSurvey. Built with ❤️ for creators everywhere.
        </p>
      </footer>
    </div>
  );
}