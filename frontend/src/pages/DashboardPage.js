// Shows the user's forms, stats, and main dashboard actions.
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import FormCard from '../components/dashboard/FormCard';
import { EmptyState, PageLoader } from '../components/ui/Common';
import {
  HiOutlinePlusCircle, HiOutlineSearch,
  HiOutlineViewGrid, HiOutlineViewList, HiOutlineRefresh
} from 'react-icons/hi';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [forms, setForms]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort]         = useState('-createdAt');
  const [view, setView]         = useState('grid');

  const recentForms = stats?.stats?.recentForms || [];
  const topForms = stats?.stats?.topForms || [];
  const weeklyData = stats?.weeklyData || [];
  const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.count, 0);
  const weeklyMax = Math.max(...weeklyData.map(day => day.count), 1);

  // ── fetch forms list ────────────────────────────────────────────────────────
  const fetchForms = useCallback(async () => {
    try {
      const params = {};
      if (search)       params.search = search;
      if (typeFilter)   params.type   = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (sort)         params.sort   = sort;
      params.limit = 100;
      const res = await api.get('/api/forms', { params });
      setForms(res.data.forms);
    } catch {
      toast.error('Failed to load forms');
    }
  }, [search, typeFilter, statusFilter, sort]);

  // ── fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/forms/stats');
      setStats(res.data);
    } catch {}
  }, []);

  // ── fetch both together ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchForms(), fetchStats()]);
    setLoading(false);
  }, [fetchForms, fetchStats]);

  // initial load + whenever filters change
  useEffect(() => {
    const t = setTimeout(fetchAll, 300);
    return () => clearTimeout(t);
  }, [fetchAll]);

  // ── refresh stats only (fast, no spinner) ───────────────────────────────────
  const refreshStats = async () => {
    setStatsLoading(true);
    await fetchStats();
    setStatsLoading(false);
  };

  // ── delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/forms/${id}`);
      toast.success('Form deleted');
      // remove from list immediately
      setForms(prev => prev.filter(f => f._id !== id));
      // refresh stats so counters update
      await refreshStats();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── duplicate ────────────────────────────────────────────────────────────────
  const handleDuplicate = async (id) => {
    try {
      const { data } = await api.post(`/api/forms/${id}/duplicate`);
      toast.success('Form duplicated!');
      setForms(prev => [data.form, ...prev]);
      await refreshStats();
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  // ── publish / unpublish ──────────────────────────────────────────────────────
  const handlePublish = async (id) => {
    try {
      const { data } = await api.post(`/api/forms/${id}/publish`);
      toast.success(data.message);
      setForms(prev =>
        prev.map(f => f._id === id
          ? { ...f, status: data.form.status, qrCode: data.form.qrCode }
          : f
        )
      );
      await refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // ── manual refresh button ────────────────────────────────────────────────────
  const handleManualRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchForms(), fetchStats()]);
    setLoading(false);
    toast.success('Dashboard refreshed');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div className="page-container">

        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Manage forms, track activity, and review performance.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleManualRefresh} className="btn btn-secondary btn-sm" title="Refresh dashboard">
              <HiOutlineRefresh size={16} />
            </button>
            <Link to="/forms/new" className="btn btn-primary">
              <HiOutlinePlusCircle size={18} /> New Form
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <DashboardStatCard
            label="Total Forms"
            value={statsLoading ? '…' : (stats?.stats?.totalForms ?? 0)}
            helper={`${forms.length} shown in current view`}
          />
          <DashboardStatCard
            label="Total Responses"
            value={statsLoading ? '…' : (stats?.stats?.totalResponses ?? 0)}
            helper={`${weeklyTotal} in the last 7 days`}
          />
          <DashboardStatCard
            label="Published"
            value={statsLoading ? '…' : (stats?.stats?.publishedForms ?? 0)}
            helper="Publicly available forms"
          />
          <DashboardStatCard
            label="Drafts"
            value={statsLoading ? '…' : (stats?.stats?.draftForms ?? 0)}
            helper="Internal work in progress"
          />
        </div>

        <div className="section-card" style={{ marginBottom: 24, padding: '18px 18px 20px' }}>
          <div className="toolbar-row dashboard-toolbar" style={{ marginBottom: 18, background: 'var(--bg-secondary)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms…"
              className="form-input"
              style={{ paddingLeft: 36, fontSize: 14 }}
            />
          </div>

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-input form-select" style={{ width: 140, fontSize: 13 }}>
            <option value="">All Types</option>
            <option value="quiz">Quiz</option>
            <option value="survey">Survey</option>
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input form-select" style={{ width: 140, fontSize: 13 }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>

          <select value={sort} onChange={e => setSort(e.target.value)} className="form-input form-select" style={{ width: 160, fontSize: 13 }}>
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-totalResponses">Most Responses</option>
            <option value="title">Title A–Z</option>
          </select>

          <div className="dashboard-toolbar-view" style={{ display: 'flex', gap: 4, marginLeft: 'auto', padding: 4, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <button onClick={() => setView('grid')} className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '7px 10px' }}>
              <HiOutlineViewGrid size={16} />
            </button>
            <button onClick={() => setView('list')} className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '7px 10px' }}>
              <HiOutlineViewList size={16} />
            </button>
          </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>All Forms</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {forms.length} form{forms.length !== 1 ? 's' : ''}
                {search || typeFilter || statusFilter ? ' match the current filters' : ' in your workspace'}
              </p>
            </div>
          </div>

          {loading ? (
            <PageLoader />
          ) : forms.length === 0 ? (
            <EmptyState
              icon="FM"
              title={search || typeFilter || statusFilter ? 'No forms match your filters' : 'No forms yet'}
              description={
                search || typeFilter || statusFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first quiz or survey to get started.'
              }
              action={
                !search && !typeFilter && !statusFilter && (
                  <Link to="/forms/new" className="btn btn-primary">
                    <HiOutlinePlusCircle size={16} /> Create Your First Form
                  </Link>
                )
              }
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
              gap: 16
            }}>
              {forms.map(form => (
                <FormCard
                  key={form._id}
                  form={form}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onPublish={handlePublish}
                  view={view}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <DashboardActivityCard weeklyData={weeklyData} weeklyMax={weeklyMax} weeklyTotal={weeklyTotal} />

          <DashboardListCard
            title="Recent Forms"
            subtitle="Your newest drafts and published forms"
            items={recentForms}
            emptyMessage="Create your first form to see it here."
            onOpen={(formId) => navigate(`/forms/${formId}/edit`)}
            actionLabel="Open"
          />

          <DashboardListCard
            title="Top Performing Forms"
            subtitle="Forms with the most responses so far"
            items={topForms}
            emptyMessage="Publish a form to start collecting responses."
            onOpen={(formId) => navigate(`/forms/${formId}/analytics`)}
            actionLabel="View"
            showResponses
          />
        </div>
      </div>
    </div>
  );
}

function DashboardStatCard({ label, value, helper }) {
  return (
    <div className="section-card" style={{ padding: '18px 20px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {helper}
      </p>
    </div>
  );
}

function DashboardActivityCard({ weeklyData, weeklyMax, weeklyTotal }) {
  return (
    <div className="section-card">
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Response Activity</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {weeklyTotal} response{weeklyTotal === 1 ? '' : 's'} recorded in the last 7 days
        </p>
      </div>

      {weeklyData.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 140 }}>
          {weeklyData.map((day) => (
            <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{day.count}</div>
              <div
                style={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${Math.max((day.count / weeklyMax) * 88, 8)}px`,
                  borderRadius: 999,
                  background: day.count > 0 ? 'var(--primary)' : 'var(--border)'
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '24px 0 12px', color: 'var(--text-secondary)', fontSize: 14 }}>
          No response activity yet this week.
        </div>
      )}
    </div>
  );
}

function DashboardListCard({ title, subtitle, items, emptyMessage, onOpen, actionLabel, showResponses = false }) {
  return (
    <div className="section-card">
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '18px 0 8px' }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((form) => (
            <button
              key={form._id}
              onClick={() => onOpen(form._id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color var(--transition), background var(--transition)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <div style={{ width: 10, height: 40, borderRadius: 999, background: form.coverColor || 'var(--primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: form.type === 'quiz' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {form.type}
                  </span>
                  <span className="badge badge-secondary" style={{ fontSize: 11 }}>{form.status}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {showResponses ? `${form.totalResponses || 0} responses` : `Created ${new Date(form.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{actionLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
