import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import FormCard from '../components/dashboard/FormCard';
import { EmptyState, PageLoader, StatCard } from '../components/ui/Common';
import {
  HiOutlinePlusCircle, HiOutlineSearch,
  HiOutlineViewGrid, HiOutlineViewList, HiOutlineChartBar,
  HiOutlineClipboardList, HiOutlineGlobe, HiOutlineRefresh
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

  // ── fetch forms list ────────────────────────────────────────────────────────
  const fetchForms = useCallback(async () => {
    try {
      const params = {};
      if (search)       params.search = search;
      if (typeFilter)   params.type   = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (sort)         params.sort   = sort;
      const res = await api.get('/forms', { params });
      setForms(res.data.forms);
    } catch {
      toast.error('Failed to load forms');
    }
  }, [search, typeFilter, statusFilter, sort]);

  // ── fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/forms/stats');
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
      await api.delete(`/forms/${id}`);
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
      const { data } = await api.post(`/forms/${id}/duplicate`);
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
      const { data } = await api.post(`/forms/${id}/publish`);
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

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Manage your quizzes and surveys
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleManualRefresh} className="btn btn-secondary btn-sm" title="Refresh dashboard">
              <HiOutlineRefresh size={16} />
            </button>
            <Link to="/forms/new" className="btn btn-primary">
              <HiOutlinePlusCircle size={18} /> Create New Form
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard
            label="Total Forms"
            value={statsLoading ? '…' : (stats?.stats?.totalForms ?? 0)}
            icon={<HiOutlineClipboardList />}
            color="#6366f1"
          />
          <StatCard
            label="Published"
            value={statsLoading ? '…' : (stats?.stats?.publishedForms ?? 0)}
            icon={<HiOutlineGlobe />}
            color="#10b981"
          />
          <StatCard
            label="Total Responses"
            value={statsLoading ? '…' : (stats?.stats?.totalResponses ?? 0)}
            icon={<HiOutlineChartBar />}
            color="#f59e0b"
          />
          <StatCard
            label="This Week"
            value={statsLoading ? '…' : (stats?.weeklyData?.reduce((s, d) => s + d.count, 0) ?? 0)}
            icon="📈"
            color="#8b5cf6"
          />
        </div>

        {/* ── Filters bar ── */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 24,
          flexWrap: 'wrap', alignItems: 'center',
          background: 'var(--bg-card)', padding: '14px 16px',
          borderRadius: 12, border: '1px solid var(--border)'
        }}>
          {/* Search */}
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

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-input form-select" style={{ width: 130, fontSize: 13 }}>
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

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <button onClick={() => setView('grid')} className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '7px 10px' }}>
              <HiOutlineViewGrid size={16} />
            </button>
            <button onClick={() => setView('list')} className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '7px 10px' }}>
              <HiOutlineViewList size={16} />
            </button>
          </div>
        </div>

        {/* ── Forms grid / list ── */}
        {loading ? (
          <PageLoader />
        ) : forms.length === 0 ? (
          <EmptyState
            icon="📋"
            title={search || typeFilter || statusFilter ? 'No forms match your filters' : 'No forms yet'}
            description={
              search || typeFilter || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'Create your first quiz or survey to get started!'
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
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              {forms.length} form{forms.length !== 1 ? 's' : ''}
              {search || typeFilter || statusFilter ? ' found' : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
              gap: 16
            }}>
              {forms.map(form => (
                <FormCard
                  key={form._id}
                  form={form}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}