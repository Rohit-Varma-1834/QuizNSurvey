import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import QuestionEditor from '../components/forms/QuestionEditor';
import { PageLoader } from '../components/ui/Common';
import {
  HiOutlineSave, HiOutlineGlobe, HiOutlineArrowLeft, HiOutlinePlus,
  HiOutlineCheckCircle, HiOutlineShieldCheck, HiOutlineCalendar,
  HiOutlineTag, HiOutlineChatAlt2,
} from 'react-icons/hi';

const COVER_COLORS = ['#0b090a', '#161a1d', '#660708', '#a4161a', '#ba181b', '#e5383b', '#b1a7a6', '#d3d3d3'];

const newQuestion = (type = 'multiple_choice') => ({
  id: uuidv4(), type,
  question: '', description: '', required: false,
  options: type === 'true_false' ? ['True','False'] : ['multiple_choice','checkbox','dropdown'].includes(type) ? ['Option 1','Option 2'] : [],
  correctAnswer: null, points: 1, ratingMax: 5, order: 0,
});

// ── TYPE SELECTOR ─────────────────────────────────────────────────────────────
function TypeSelector({ onSelect }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', minHeight: 'calc(100vh - 60px)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>What do you want to create?</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 52, textAlign: 'center', fontSize: 16 }}>Choose the type that fits your goal</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, maxWidth: 720, width: '100%' }}>

          {/* QUIZ */}
          <button onClick={() => onSelect('quiz')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: 22, padding: '36px 28px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.22s', outline: 'none' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(239,35,60,0.18)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 20 }}>🧠</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: 'var(--primary)' }}>Quiz</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              Test knowledge with right/wrong answers. Auto-grade responses, set timers, define passing scores, and show results instantly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['✅ Auto-grading & instant scoring','⏱️ Time limit per quiz','🎯 Set pass/fail threshold','📊 Detailed score analytics'].map(f => (
                <span key={f} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
              ))}
            </div>
            <div style={{ marginTop: 24, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', color: 'white', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, textAlign: 'center', boxShadow: '0 4px 14px rgba(239,35,60,0.28)' }}>
              🧠 Create Quiz →
            </div>
          </button>

          {/* SURVEY */}
          <button onClick={() => onSelect('survey')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: 22, padding: '36px 28px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.22s', outline: 'none' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(43,45,66,0.18)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 20 }}>📋</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: 'var(--secondary)' }}>Survey</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              Collect opinions, feedback, and data. No right or wrong answers. Perfect for research, feedback forms, polls, and event check-ins.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['🕵️ Optional anonymous responses','📅 Auto-close on expiry date','💬 Open-ended text questions','📈 Response trend analytics'].map(f => (
                <span key={f} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
              ))}
            </div>
            <div style={{ marginTop: 24, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)', color: 'white', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, textAlign: 'center', boxShadow: '0 4px 14px rgba(43,45,66,0.24)' }}>
              📋 Create Survey →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SHARED BUILDER SHELL ──────────────────────────────────────────────────────
function BuilderShell({ type, form, setForm, formId, onSaved, questionTypes }) {
  const navigate = useNavigate();
  const isEdit = Boolean(formId);
  const isQuiz = type === 'quiz';
  const accent = isQuiz ? '#ba181b' : '#161a1d';
  const lightBg = isQuiz ? 'var(--primary-light)' : 'var(--success-soft)';
  const label = isQuiz ? '🧠 Quiz' : '📋 Survey';

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.questions.length === 0) e.questions = 'Add at least one question';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    ...form, type,
    tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    expiresAt: form.expiresAt || null,
    settings: {
      ...form.settings,
      timeLimit: form.settings.timeLimit ? Number(form.settings.timeLimit) : null,
      passingScore: form.settings.passingScore ? Number(form.settings.passingScore) : null,
    },
  });

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the errors'); return; }
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/api/forms/${formId}`, buildPayload()); toast.success(`${isQuiz ? 'Quiz' : 'Survey'} saved!`); }
      else { const { data } = await api.post('/api/forms', buildPayload()); toast.success(`${isQuiz ? 'Quiz' : 'Survey'} created!`); onSaved(data.form._id); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!isEdit) { toast.error('Save first'); return; }
    if (!validate()) { toast.error('Fix errors first'); return; }
    setPublishing(true);
    try {
      const { data } = await api.post(`/api/forms/${formId}/publish`);
      toast.success(data.message);
      setForm(f => ({ ...f, status: data.form.status }));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPublishing(false); }
  };

  const addQ = (qType) => setForm(f => { const q = newQuestion(qType); q.order = f.questions.length; return { ...f, questions: [...f.questions, q] }; });
  const updateQ = (i, u) => setForm(f => { const qs = [...f.questions]; qs[i] = u; return { ...f, questions: qs }; });
  const deleteQ = (i) => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  const dupQ = (i) => setForm(f => { const qs = [...f.questions]; qs.splice(i+1, 0, {...qs[i], id: uuidv4()}); return {...f, questions: qs}; });
  const moveQ = (i, dir) => setForm(f => { const qs = [...f.questions]; const to = i+dir; if(to<0||to>=qs.length) return f; [qs[i],qs[to]]=[qs[to],qs[i]]; return {...f, questions: qs}; });

  const totalPoints = form.questions.reduce((s, q) => s + (q.points || 1), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Sticky top bar */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '0 24px', position: 'sticky', top: 60, zIndex: 50 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 60 }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
            <HiOutlineArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <input value={form.title}
              onChange={e => { setForm(f => ({...f, title: e.target.value})); setErrors(p => ({...p, title:''})); }}
              placeholder={`${isQuiz ? 'Quiz' : 'Survey'} Title...`}
              style={{ border:'none', background:'transparent', fontSize:17, fontWeight:700, width:'100%', color:'var(--text-primary)', outline:'none', fontFamily:'var(--font-display)', borderBottom: errors.title ? '2px solid var(--danger)' : '2px solid transparent', paddingBottom:2 }}
            />
          </div>
          <div style={{ background: lightBg, color: accent, borderRadius:8, padding:'5px 14px', fontSize:13, fontWeight:700 }}>{label}</div>
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, textTransform:'uppercase', background: form.status==='published'?'var(--success-soft)':'var(--bg-secondary)', color: form.status==='published'?'var(--secondary)':'var(--text-muted)' }}>
            {form.status || 'draft'}
          </span>
          <button onClick={handleSave} disabled={saving} className="btn btn-secondary btn-sm">
            <HiOutlineSave size={15}/> {saving ? 'Saving…' : 'Save'}
          </button>
          {isEdit && (
            <button onClick={handlePublish} disabled={publishing} className="btn btn-sm" style={{ background: accent, color:'white' }}>
              <HiOutlineGlobe size={15}/> {publishing ? '…' : form.status==='published' ? 'Unpublish' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '28px auto 60px', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 264px', gap: 24 }}>

        {/* LEFT PANEL */}
        <div>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:22, borderBottom:'1px solid var(--border)' }}>
            {[{key:'questions', label: isQuiz ? '❓ Questions' : '📋 Questions'}, {key:'settings', label: isQuiz ? '🎯 Quiz Settings' : '⚙️ Survey Settings'}].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, border:'none', background:'transparent', cursor:'pointer', color: activeTab===tab.key ? accent : 'var(--text-secondary)', borderBottom: activeTab===tab.key ? `2px solid ${accent}` : '2px solid transparent', marginBottom:-1, transition:'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* QUESTIONS TAB */}
          {activeTab === 'questions' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Meta card */}
              <div className="card" style={{ padding:'20px 22px', borderLeft:`4px solid ${accent}` }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="form-input form-textarea" placeholder={isQuiz ? "What is this quiz about?" : "What feedback are you collecting? Give respondents context."} rows={2} style={{fontSize:14}}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className="form-input form-select" style={{fontSize:13}}>
                      {(isQuiz ? ['education','business','research','events','other'] : ['feedback','research','business','events','education','other']).map(c=>(
                        <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cover Color</label>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                      {COVER_COLORS.map(c=>(
                        <button key={c} onClick={()=>setForm(f=>({...f,coverColor:c}))} style={{ width:26, height:26, borderRadius:7, background:c, border:'none', cursor:'pointer', boxShadow: form.coverColor===c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none', transition:'all 0.15s' }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {errors.questions && <div style={{ background:'var(--danger-soft)', border:'1px solid color-mix(in srgb, var(--danger) 28%, var(--bg-secondary) 72%)', borderRadius:8, padding:'10px 16px', fontSize:13, color:'var(--danger)' }}>⚠️ {errors.questions}</div>}

              {/* Empty state */}
              {form.questions.length === 0 && (
                <div style={{ textAlign:'center', padding:'52px 24px', borderRadius:16, border:`2px dashed ${accent}40`, background: lightBg+'30' }}>
                  <p style={{ fontSize:40, marginBottom:10 }}>{isQuiz ? '🧠' : '📋'}</p>
                  <h3 style={{ marginBottom:6 }}>No questions yet</h3>
                  <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:20 }}>Click a question type on the right to add your first question</p>
                </div>
              )}

              {/* Questions list */}
              {form.questions.map((q, i) => (
                <div key={q.id}>
                  {errors[`q_${i}`] && <p style={{ fontSize:12, color:'var(--danger)', marginBottom:4 }}>⚠️ {errors[`q_${i}`]}</p>}
                  <QuestionEditor question={q} index={i} total={form.questions.length} formType={type}
                    onChange={u=>updateQ(i,u)} onDelete={()=>deleteQ(i)} onDuplicate={dupQ} onMove={moveQ}/>
                </div>
              ))}

              {form.questions.length > 0 && (
                <button onClick={()=>addQ('multiple_choice')} className="btn btn-secondary" style={{ alignSelf:'center' }}>
                  <HiOutlinePlus size={16}/> Add Question
                </button>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* QUIZ specific settings */}
              {isQuiz && (
                <div className="card" style={{ padding:'22px 24px', borderLeft:`4px solid ${accent}` }}>
                  <h3 style={{ fontSize:15, fontWeight:700, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}><HiOutlineCheckCircle color={accent}/> Scoring & Timer</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                    <div className="form-group">
                      <label className="form-label">⏱️ Time Limit (minutes)</label>
                      <input type="number" className="form-input" value={form.settings.timeLimit||''} onChange={e=>setForm(f=>({...f,settings:{...f.settings,timeLimit:e.target.value}}))} placeholder="No limit" min={1}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">🎯 Passing Score (%)</label>
                      <input type="number" className="form-input" value={form.settings.passingScore||''} onChange={e=>setForm(f=>({...f,settings:{...f.settings,passingScore:e.target.value}}))} placeholder="No pass/fail" min={0} max={100}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                      {key:'showScore', label:'📊 Show score to respondent after submission'},
                      {key:'showCorrectAnswers', label:'✅ Reveal correct answers after submission'},
                      {key:'shuffleQuestions', label:'🔀 Shuffle question order for each respondent'},
                      {key:'allowMultipleResponses', label:'🔁 Allow multiple attempts'},
                      {key:'showProgressBar', label:'📶 Show progress bar'},
                    ].map(opt=>(
                      <label key={opt.key} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14, padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background: form.settings[opt.key] ? lightBg : 'transparent' }}>
                        <input type="checkbox" checked={!!form.settings[opt.key]} onChange={e=>setForm(f=>({...f,settings:{...f.settings,[opt.key]:e.target.checked}}))} style={{ accentColor:accent }}/>
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* SURVEY specific settings */}
              {!isQuiz && (
                <div className="card" style={{ padding:'22px 24px', borderLeft:`4px solid ${accent}` }}>
                  <h3 style={{ fontSize:15, fontWeight:700, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}><HiOutlineShieldCheck color={accent}/> Privacy & Access</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                      {key:'allowAnonymous', label:'🕵️ Collect responses anonymously (hide name & email)'},
                      {key:'allowMultipleResponses', label:'🔁 Allow multiple submissions from the same person'},
                      {key:'showProgressBar', label:'📶 Show progress bar to respondents'},
                    ].map(opt=>(
                      <label key={opt.key} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14, padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background: form.settings[opt.key] ? lightBg : 'transparent' }}>
                        <input type="checkbox" checked={!!form.settings[opt.key]} onChange={e=>setForm(f=>({...f,settings:{...f.settings,[opt.key]:e.target.checked}}))} style={{ accentColor:accent }}/>
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation message */}
              <div className="card" style={{ padding:'22px 24px' }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}><HiOutlineChatAlt2 color={accent}/> {isQuiz ? 'Completion Message' : 'Thank You Message'}</h3>
                <input className="form-input" value={form.settings.confirmationMessage||''} onChange={e=>setForm(f=>({...f,settings:{...f.settings,confirmationMessage:e.target.value}}))} placeholder={isQuiz ? "Great work! Your quiz has been submitted." : "Thank you for your feedback!"}/>
              </div>

              {/* Schedule & tags */}
              <div className="card" style={{ padding:'22px 24px' }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><HiOutlineCalendar color={accent}/> Schedule & Tags</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div className="form-group">
                    <label className="form-label">{isQuiz ? 'Quiz Expires On' : 'Close Survey On'}</label>
                    <input type="date" className="form-input" value={form.expiresAt||''} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))} min={new Date().toISOString().split('T')[0]}/>
                    <span className="form-hint">Stops accepting responses after this date</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma separated)</label>
                    <input className="form-input" value={form.tags||''} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder={isQuiz ? "e.g. math, chapter3, midterm" : "e.g. feedback, q1-2025, customers"}/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ position:'sticky', top:120, alignSelf:'flex-start' }}>
          <div className="card" style={{ padding:18, borderTop:`3px solid ${accent}`, overflow:'hidden' }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              + Add Question
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {questionTypes.map(qt=>(
                <button key={qt.type} onClick={()=>addQ(qt.type)} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                  borderRadius:8, border:`1.5px solid var(--border)`, background:'var(--bg-card)',
                  cursor:'pointer', textAlign:'left', transition:'all 0.15s', width:'100%'
                }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=accent; e.currentTarget.style.background=lightBg; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-card)'; }}
                >
                  <span style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{qt.icon}</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, margin:0 }}>{qt.label}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{qt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Summary box */}
            {form.questions.length > 0 && (
              <div style={{ marginTop:16, padding:14, background:lightBg, borderRadius:12 }}>
                <p style={{ fontSize:12, fontWeight:700, color:accent, marginBottom:8 }}>{isQuiz ? '🧠 Quiz Summary' : '📋 Survey Summary'}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>📝 {form.questions.length} question{form.questions.length!==1?'s':''}</p>
                  {isQuiz && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>⭐ {totalPoints} total points</p>}
                  {!isQuiz && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>❗ {form.questions.filter(q=>q.required).length} required</p>}
                  {form.settings.timeLimit && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>⏱️ {form.settings.timeLimit} min limit</p>}
                  {form.settings.passingScore && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>🎯 Pass at {form.settings.passingScore}%</p>}
                  {form.settings.allowAnonymous && <p style={{ fontSize:13, color:accent, margin:0 }}>🕵️ Anonymous mode on</p>}
                  {form.expiresAt && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>📅 Closes {form.expiresAt}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const QUIZ_TYPES = [
  {type:'multiple_choice', label:'Multiple Choice', icon:'◉', desc:'One correct answer'},
  {type:'checkbox', label:'Checkboxes', icon:'☑', desc:'Multiple correct answers'},
  {type:'true_false', label:'True / False', icon:'⊙', desc:'Binary choice'},
  {type:'short_answer', label:'Short Answer', icon:'✏️', desc:'Text answer with key'},
  {type:'dropdown', label:'Dropdown', icon:'▼', desc:'Pick from list'},
];

const SURVEY_TYPES = [
  {type:'multiple_choice', label:'Multiple Choice', icon:'◉', desc:'Pick one option'},
  {type:'checkbox', label:'Checkboxes', icon:'☑', desc:'Pick multiple options'},
  {type:'short_answer', label:'Short Answer', icon:'✏️', desc:'Brief text response'},
  {type:'paragraph', label:'Paragraph', icon:'📝', desc:'Long text answer'},
  {type:'rating', label:'Rating Scale', icon:'⭐', desc:'Star rating 1–10'},
  {type:'dropdown', label:'Dropdown', icon:'▼', desc:'Select from list'},
  {type:'true_false', label:'Yes / No', icon:'⊙', desc:'Binary choice'},
];

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function FormBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(isEdit);

  const defaultForm = (type) => ({
    title:'', description:'', category: type==='quiz' ? 'education' : 'feedback',
    coverColor: type==='quiz' ? '#ba181b' : '#161a1d',
    questions:[], tags:'', expiresAt:'', status:'draft',
    settings: type==='quiz'
      ? { showScore:true, showCorrectAnswers:false, shuffleQuestions:false, timeLimit:'', passingScore:'', allowMultipleResponses:false, showProgressBar:true, confirmationMessage:'Great work! Your quiz has been submitted.' }
      : { allowAnonymous:false, allowMultipleResponses:true, showProgressBar:true, confirmationMessage:'Thank you for your feedback!' },
  });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/api/forms/${id}`).then(({ data }) => {
      const f = data.form;
      setSelectedType(f.type);
      setForm({ ...defaultForm(f.type), ...f, tags: Array.isArray(f.tags) ? f.tags.join(', ') : '', expiresAt: f.expiresAt ? f.expiresAt.split('T')[0] : '', settings: { ...defaultForm(f.type).settings, ...f.settings } });
    }).catch(() => { toast.error('Form not found'); navigate('/dashboard'); })
    .finally(() => setLoading(false));
  }, [id]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setForm(defaultForm(type));
  };

  const handleSaved = (newId) => navigate(`/forms/${newId}/edit`, { replace: true });

  if (loading) return <><Navbar /><PageLoader /></>;
  if (!selectedType || !form) return <TypeSelector onSelect={handleTypeSelect} />;

  return (
    <BuilderShell
      type={selectedType} form={form} setForm={setForm}
      formId={id} onSaved={handleSaved}
      questionTypes={selectedType === 'quiz' ? QUIZ_TYPES : SURVEY_TYPES}
    />
  );
}
