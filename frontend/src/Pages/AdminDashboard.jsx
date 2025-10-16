// Helper to export data as CSV
function exportToCSV(filename, rows, headers) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to export data as JSON
function exportToJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// Helper to get model health details from training results (accepts runtime data)
function getModelHealthRows(trainingResults) {
  if (!trainingResults || !trainingResults.results) return [];
  return Object.entries(trainingResults.results).map(([backend, result]) => ({
    backend: backend.charAt(0).toUpperCase() + backend.slice(1),
    accuracy: result.accuracy,
    confidence: result.confidence,
    lastTrained: trainingResults.endTime ? new Date(trainingResults.endTime).toLocaleString() : 'N/A',
    success: result.success
  }));
}
// Helper to compute intent and entity coverage from annotation file
function getIntentCoverage(entityAnnotations) {
  const intentCounts = {};
  if (entityAnnotations && entityAnnotations.annotations) {
    entityAnnotations.annotations.forEach(item => {
      if (item.intent) {
        intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
      }
    });
  }
  return Object.entries(intentCounts).map(([intent, count]) => ({ intent, count }));
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthToken } from '../utils/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
// Helper to compute entity distribution from annotation file (accepts data at runtime)
function getEntityDistribution(entityAnnotations) {
  const entityCounts = {};
  if (entityAnnotations && entityAnnotations.annotations) {
    entityAnnotations.annotations.forEach(item => {
      if (item.entities && Array.isArray(item.entities)) {
        item.entities.forEach(entity => {
          if (entity.label) {
            entityCounts[entity.label] = (entityCounts[entity.label] || 0) + 1;
          }
        });
      }
    });
  }
  return Object.entries(entityCounts).map(([label, count]) => ({ label, count }));
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Real data states
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [realtimeMetrics, setRealtimeMetrics] = useState({});
  const [userActivity, setUserActivity] = useState([]);

  
    // Models state
  const [models, setModels] = useState([]);
    // Runtime data loaded from backend (replaces static imports)
    const [trainingResults, setTrainingResults] = useState(null);
    const [entityAnnotations, setEntityAnnotations] = useState(null);
    const [availableUploads, setAvailableUploads] = useState({});
    const [selectedUploadKey, setSelectedUploadKey] = useState('');
    const workspaceScrollerRef = useRef(null);

  // Fetch all models
  const fetchModels = async () => {
    try {
      const response = await apiCall('/training/models');
      setModels(response.models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  };
  // Use centralized auth helper
  // getAuthToken is imported from ../utils/auth

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:3001/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  };

  // Fetch all users (admin only)
  const fetchUsers = async () => {
    try {
      const response = await apiCall('/admin/users');
      console.log('Fetched users:', response.users);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // Create user
  const createUser = async (user) => {
    try {
      const response = await apiCall('/auth/users', {
        method: 'POST',
        body: JSON.stringify(user)
      });
      await fetchUsers();
      return response;
    } catch (error) {
      // Try to extract backend error message
      let msg = error.message;
      if (error && error.message && error.message.startsWith('HTTP')) {
        try {
          const res = await fetch(`http://localhost:3001/api/auth/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : '' },
            body: JSON.stringify(user)
          });
          const data = await res.json();
          msg = data.message || msg;
        } catch {}
      }
      throw new Error(msg);
    }
  };

  // Update user
  const updateUser = async (id, user) => {
    try {
      const response = await apiCall(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user)
      });
      await fetchUsers();
      return response;
    } catch (error) {
      let msg = error.message;
      if (error && error.message && error.message.startsWith('HTTP')) {
        try {
          const res = await fetch(`http://localhost:3001/api/auth/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : '' },
            body: JSON.stringify(user)
          });
          const data = await res.json();
          msg = data.message || msg;
        } catch {}
      }
      throw new Error(msg);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiCall(`/auth/users/${id}`, { method: 'DELETE' });
      await fetchUsers();
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  // Toggle workspace status (active/inactive)
  const toggleWorkspaceStatus = async (workspaceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/admin/workspaces/${workspaceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchWorkspaces();
    } catch (err) {
      alert('Failed to toggle workspace status: ' + err.message);
    }
  };

  // Delete workspace
  const deleteWorkspace = async (workspaceId) => {
    if (!window.confirm('Are you sure you want to delete this workspace and its models?')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/admin/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchWorkspaces();
    } catch (err) {
      alert('Failed to delete workspace: ' + err.message);
    }
  };

  // User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [userFormError, setUserFormError] = useState('');

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', password: '', role: 'user' });
    setUserFormError('');
    setShowUserForm(true);
  };
  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ username: user.username, email: user.email, password: '', role: user.role });
    setUserFormError('');
    setShowUserForm(true);
  };
  const closeUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setUserForm({ username: '', email: '', password: '', role: 'user' });
    setUserFormError('');
  };
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
    setUserFormError('');
  };
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    setUserFormError('');
    try {
      if (editingUser) {
        await updateUser(editingUser._id || editingUser.id, userForm);
      } else {
        await createUser(userForm);
      }
      closeUserForm();
    } catch (err) {
      setUserFormError(err?.message || 'Failed to submit user form');
    }
  };

  // Fetch workspaces
  const fetchWorkspaces = async () => {
    try {
      const response = await apiCall('/admin/workspaces');
      console.log('Fetched workspaces:', response.workspaces);
      setWorkspaces(response.workspaces || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      // Use fallback data only if API fails
      setWorkspaces([
        { id: 1, name: 'HR Bot', owner: 'admin', createdAt: '2024-01-01', modelsCount: 3, datasetsCount: 5, status: 'active' },
        { id: 2, name: 'Travel Bot', owner: 'user1', createdAt: '2024-01-05', modelsCount: 2, datasetsCount: 3, status: 'active' },
        { id: 3, name: 'Support Bot', owner: 'user2', createdAt: '2024-01-10', modelsCount: 1, datasetsCount: 2, status: 'active' }
      ]);
    }
  };

  // Fetch system health metrics
  const fetchSystemHealth = async () => {
    try {
      const response = await apiCall('/analytics/system-health');
      setSystemHealth(response.data || {});
    } catch (error) {
      console.error('Error fetching system health:', error);
      setSystemHealth({
        cpuUsage: Math.floor(Math.random() * 60) + 20,
        memoryUsage: Math.floor(Math.random() * 50) + 30,
        responseTime: Math.floor(Math.random() * 200) + 100,
        activeBackends: 3,
        totalBackends: 3,
        uptime: Math.floor((Date.now() - new Date('2024-12-20').getTime()) / 1000),
        status: 'healthy'
      });
    }
  };

  // Fetch realtime metrics
  const fetchRealtimeMetrics = async () => {
    try {
      const response = await apiCall('/analytics/realtime-metrics');
      setRealtimeMetrics(response.data || {});
      
      // Update system stats from realtime data
      setSystemStats(prevStats => ({
        ...prevStats,
        totalUsers: users.length,
        activeWorkspaces: workspaces.filter(w => w.status === 'active').length,
        totalModels: workspaces.reduce((sum, w) => sum + (w.modelsCount || 0), 0),
        totalDatasets: workspaces.reduce((sum, w) => sum + (w.datasetsCount || 0), 0),
        apiRequests: response.data.totalRequests || 0,
        totalTrainingSessions: response.data.totalTrainingSessions || 0,
        totalPredictions: response.data.totalPredictions || 0,
        systemUptime: response.data.uptime ? `${Math.floor(response.data.uptime / 86400)} days` : 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
    }
  };

  // Fetch user activity
  const fetchUserActivity = async () => {
    try {
      const response = await apiCall('/analytics/user-activity?limit=10');
      setUserActivity(response.data?.activities || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setUserActivity([]);
    }
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchUsers(),
        fetchWorkspaces(),
        fetchModels(),
        fetchSystemHealth(),
        fetchRealtimeMetrics(),
        fetchUserActivity()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setError('Failed to load admin data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Load available uploads for user selection (public endpoint)
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiCall('/public/recent-uploads');
        if (resp && resp.workspaces) {
          setAvailableUploads(resp.workspaces);
          const keys = Object.keys(resp.workspaces || {});
          if (keys.length > 0) setSelectedUploadKey(keys[0]);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // When workspaces list changes, load annotations and model info for the first workspace
  useEffect(() => {
    const loadWorkspaceData = async (workspaceId) => {
      if (!workspaceId) return;
      try {
        // Load entity annotations via API
        try {
          const ea = await apiCall(`/entities/annotations/${workspaceId}`);
          // API returns { annotations, totalSamples, totalEntities, createdAt }
          setEntityAnnotations({ annotations: ea.annotations, totalSamples: ea.totalSamples, totalEntities: ea.totalEntities, createdAt: ea.createdAt });
        } catch (e) {
          setEntityAnnotations(null);
        }

        // Load model info and list of trained models for workspace
        try {
          // model-info returns model: { id, workspaceId, createdAt, status, intents, trainingExamples }
          const modelInfoResp = await apiCall(`/training/model-info/${workspaceId}`);
          const model = modelInfoResp.model;
          // Build a lightweight trainingResults structure for the dashboard
          const results = {
            results: {
              trained: {
                accuracy: model?.accuracy ?? null,
                confidence: model?.confidence ?? null,
                success: model ? true : false
              }
            },
            endTime: model?.createdAt || null
          };
          setTrainingResults(results);
        } catch (e) {
          // Try listing models and pick one for this workspace
          try {
            const modelsResp = await apiCall('/training/models');
            const modelsForWs = (modelsResp.models || []).filter(m => m.workspaceId == workspaceId || m.workspaceId === String(workspaceId));
            if (modelsForWs.length > 0) {
              const m = modelsForWs.sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||'')).pop();
              const results = { results: { trained: { accuracy: null, confidence: null, success: true } }, endTime: m.createdAt };
              setTrainingResults(results);
            } else {
              setTrainingResults(null);
            }
          } catch (ee) {
            setTrainingResults(null);
          }
        }
      } catch (err) {
        console.error('Failed to load workspace data for admin dashboard:', err);
      }
    };

    if (workspaces && workspaces.length > 0) {
      const firstWs = workspaces[0];
      loadWorkspaceData(firstWs.id || firstWs._id || firstWs.name);
    } else {
      // No workspaces available from API; try the public recent uploads endpoint as fallback
      (async () => {
        try {
          const resp = await apiCall('/public/recent-uploads');
          if (resp && resp.workspaces) {
            // pick the first workspace key
            const keys = Object.keys(resp.workspaces || {});
            if (keys.length > 0) {
              const wk = resp.workspaces[keys[0]];
              if (wk.lastAnnotation) setEntityAnnotations({ annotations: wk.lastAnnotation.sample || [], totalSamples: wk.lastAnnotation.totalSamples, totalEntities: wk.lastAnnotation.totalEntities, createdAt: wk.lastAnnotation.createdAt });
              if (wk.lastTraining) setTrainingResults({ results: wk.lastTraining.summary ? wk.lastTraining.summary.results : {}, endTime: wk.lastTraining.createdAt });
            }
          }
        } catch (e) {
          console.warn('Public recent-uploads fallback failed', e.message);
        }
      })();
    }
  }, [workspaces]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchAllData();
  };

  // Format uptime display
  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Format date display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Calculate system status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Simple error boundary
  if (error && !loading) {
    return (
      <div style={{
        padding: '25px',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        minHeight: '100vh',
        borderRadius: '16px',
        margin: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h1>⚠️ Admin Dashboard Error</h1>
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          style={{
            padding: '10px 20px',
            background: '#ffffff',
            color: '#ef4444',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '25px', 
      background: 'linear-gradient(135deg, #46218cff 0%, #3e275fff 50%, #4c3a84ff 100%)',
      color: '#ffffff',
      minHeight: '100vh',
      borderRadius: '16px',
      margin: '10px',
      border: '2px solid #475569',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      position: 'relative'
    }}>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <h1 style={{ 
          color: '#f7fbffff', 
          fontSize: '32px', 
          margin: 0,
          fontWeight: 'bold',
          textShadow: '0 2px 10px rgba(96, 165, 250, 0.5)'
        }}>
          🛠️ Admin Dashboard
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* System Status Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '20px',
            border: `2px solid ${getStatusColor(systemHealth.status)}`
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: getStatusColor(systemHealth.status),
              boxShadow: `0 0 10px ${getStatusColor(systemHealth.status)}`
            }} />
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
              {systemHealth.status || 'unknown'}
            </span>
          </div>
          
          {/* Last Refresh */}
          {lastRefresh && (
            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#6b7280' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔄</span>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{
          padding: '15px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          color: '#ffffff',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '30px',
        justifyContent: 'center'
      }}>
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'users', label: 'Users', icon: '👥' },
          { key: 'workspaces', label: 'Workspaces', icon: '📁' },
          { key: 'system', label: 'System', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 25px',
              backgroundColor: activeTab === tab.key ? '#3b82f6' : '#475569',
              color: activeTab === tab.key ? '#ffffff' : '#e2e8f0',
              border: activeTab === tab.key ? '2px solid #60a5fa' : '2px solid #64748b',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'capitalize',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === tab.key ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #475569',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              Loading Admin Data...
            </div>
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <div style={{ 
        padding: '30px',
        background: 'rgba(66, 53, 128, 0.9)',
        borderRadius: '16px',
        border: '2px solid #475569',
        minHeight: '500px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ 
              color: '#3ce6a8ff', 
              marginBottom: '25px', 
              fontSize: '28px',
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(52, 211, 153, 0.4)'
            }}>
              📊 System Overview
            </h2>

            {/* Export Analytics/Statistics Buttons */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                title="Download entity distribution as CSV file"
                onClick={() => exportToCSV('entity_distribution.csv', getEntityDistribution(entityAnnotations), ['label', 'count'])}
              >Export Entities (CSV)</button>
              <button
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                title="Download intent coverage as CSV file"
                onClick={() => exportToCSV('intent_coverage.csv', getIntentCoverage(entityAnnotations), ['intent', 'count'])}
              >Export Intents (CSV)</button>
              <button
                style={{ background: '#a855f7', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                title="Download model health details as CSV file"
                onClick={() => exportToCSV('model_health.csv', getModelHealthRows(trainingResults), ['backend', 'accuracy', 'confidence', 'lastTrained', 'success'])}
              >Export Model Health (CSV)</button>
              <button
                style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                title="Download all analytics/statistics as JSON file"
                onClick={() => exportToJSON('analytics_export.json', {
                  entities: getEntityDistribution(entityAnnotations),
                  intents: getIntentCoverage(entityAnnotations),
                  modelHealth: getModelHealthRows(trainingResults)
                })}
              >Export All (JSON)</button>
            </div>
            {/* Entity Distribution Bar Chart */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#cbd5e1', marginRight: 8 }}>Select saved workspace data:</label>
              <select value={selectedUploadKey} onChange={e => setSelectedUploadKey(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
                {Object.keys(availableUploads).length === 0 && <option value="">(no saved uploads)</option>}
                {Object.keys(availableUploads).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <button onClick={async () => {
                if (!selectedUploadKey) return;
                const wk = availableUploads[selectedUploadKey];
                const backendBase = 'http://localhost:3001';
                if (wk.lastTraining && wk.lastTraining.path) {
                  try {
                    const tRes = await fetch(`${backendBase}/uploads/training-results/${selectedUploadKey}_multi_backend_training.json`);
                    if (tRes && tRes.ok) setTrainingResults(await tRes.json());
                  } catch (err) {
                    console.warn('Failed to load training results from backend uploads', err.message);
                  }
                }
                if (wk.lastAnnotation && wk.lastAnnotation.path) {
                  try {
                    const aRes = await fetch(`${backendBase}/uploads/entity-annotations/${selectedUploadKey}_annotations.json`);
                    if (aRes && aRes.ok) setEntityAnnotations(await aRes.json());
                  } catch (err) {
                    console.warn('Failed to load annotations from backend uploads', err.message);
                  }
                }
              }} style={{ marginLeft: 12, padding: '6px 10px', borderRadius: 6 }}>Load</button>
            </div>
            <div style={{ marginBottom: 30, background: '#232044', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <h3 style={{ color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>Entity Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getEntityDistribution(entityAnnotations)} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#fff" />
                  <YAxis stroke="#fff" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dataset Coverage Breakdown */}
            <div style={{ marginBottom: 30, background: '#232044', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <h3 style={{ color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>Dataset Coverage Breakdown</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
                <div>
                  <h4 style={{ color: '#10b981', marginBottom: 8 }}>Intents</h4>
                  <table style={{ color: '#fff', borderCollapse: 'collapse', minWidth: 180 }}>
                    <thead>
                      <tr><th style={{ textAlign: 'left', padding: 4 }}>Intent</th><th style={{ textAlign: 'right', padding: 4 }}>Count</th></tr>
                    </thead>
                    <tbody>
                      {getIntentCoverage(entityAnnotations).map(row => (
                        <tr key={row.intent}>
                          <td style={{ padding: 4 }}>{row.intent}</td>
                          <td style={{ padding: 4, textAlign: 'right' }}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 style={{ color: '#10b981', marginBottom: 8 }}>Entities</h4>
                  <table style={{ color: '#fff', borderCollapse: 'collapse', minWidth: 180 }}>
                    <thead>
                      <tr><th style={{ textAlign: 'left', padding: 4 }}>Entity</th><th style={{ textAlign: 'right', padding: 4 }}>Count</th></tr>
                    </thead>
                    <tbody>
                      {getEntityDistribution(entityAnnotations).map(row => (
                        <tr key={row.label}>
                          <td style={{ padding: 4 }}>{row.label}</td>
                          <td style={{ padding: 4, textAlign: 'right' }}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Model Health Details */}
            <div style={{ marginBottom: 30, background: '#232044', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <h3 style={{ color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>Model Health Details</h3>
              <table style={{ color: '#fff', borderCollapse: 'collapse', minWidth: 320 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 4 }}>Backend</th>
                    <th style={{ textAlign: 'right', padding: 4 }}>Accuracy</th>
                    <th style={{ textAlign: 'right', padding: 4 }}>Confidence</th>
                    <th style={{ textAlign: 'right', padding: 4 }}>Last Trained</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getModelHealthRows(trainingResults).map((row, idx) => (
                    <tr key={row.backend + idx}>
                      <td style={{ padding: 4 }}>{row.backend}</td>
                      <td style={{ padding: 4, textAlign: 'right' }}>{row.accuracy != null ? (row.accuracy * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td style={{ padding: 4, textAlign: 'right' }}>{row.confidence != null ? (row.confidence * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td style={{ padding: 4, textAlign: 'right' }}>{row.lastTrained}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>
                        {row.success ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>Healthy</span> : <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Error</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '35px',
              width: '100%',
              maxWidth: '100vw',
            }}>
              <div style={{
                padding: '25px',
                background: 'linear-gradient(135deg, #6d9e8eff 0%, #10b981 100%)',
                borderRadius: '16px',
                textAlign: 'center',
                border: '2px solid #34d399',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#ffffff', 
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  Total Users
                </h3>
                <p style={{ 
                  fontSize: '42px', 
                  fontWeight: 'bold', 
                  margin: '0', 
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  {users.length || 0}
                </p>
              </div>

              <div style={{
                padding: '25px',
                background: 'linear-gradient(135deg, #5b49a2ff 0%, #3b82f6 100%)',
                borderRadius: '16px',
                textAlign: 'center',
                border: '2px solid #60a5fa',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#ffffff', 
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  Active Workspaces
                </h3>
                <p style={{ 
                  fontSize: '42px', 
                  fontWeight: 'bold', 
                  margin: '0', 
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  {workspaces.filter(w => w.status === 'active').length || 0}
                </p>
              </div>

              <div style={{
                padding: '25px',
                background: 'linear-gradient(135deg, #768e41ff 0%, #93932aff 100%)',
                borderRadius: '16px',
                textAlign: 'center',
                border: '2px solid #fbbf24',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#ffffff', 
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  Total Models
                </h3>
                <p style={{ 
                  fontSize: '42px', 
                  fontWeight: 'bold', 
                  margin: '0', 
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  {workspaces.reduce((sum, w) => sum + (w.modelsCount || 0), 0) || 0}
                </p>
              </div>

              <div style={{
                padding: '25px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                borderRadius: '16px',
                textAlign: 'center',
                border: '2px solid #c084fc',
                boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#ffffff', 
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  API Requests
                </h3>
                <p style={{ 
                  fontSize: '42px', 
                  fontWeight: 'bold', 
                  margin: '0', 
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  {(realtimeMetrics.totalRequests || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: `linear-gradient(135deg, ${systemHealth.status === 'healthy' ? '#059669 0%, #10b981 100%' : systemHealth.status === 'warning' ? '#f59e0b 0%, #fbbf24 100%' : '#ef4444 0%, #f87171 100%'})`,
              borderRadius: '12px',
              textAlign: 'center',
              border: `2px solid ${getStatusColor(systemHealth.status)}`,
              boxShadow: `0 6px 15px rgba(${systemHealth.status === 'healthy' ? '16, 185, 129' : systemHealth.status === 'warning' ? '245, 158, 11' : '239, 68, 68'}, 0.3)`
            }}>
              <p style={{ 
                margin: 0, 
                color: '#ffffff', 
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {systemHealth.status === 'healthy' ? '✅' : systemHealth.status === 'warning' ? '⚠️' : '❌'} 
                System Status: {systemHealth.status?.toUpperCase() || 'UNKNOWN'} - 
                Uptime: {formatUptime(systemHealth.uptime) || 'Unknown'}
              </p>
              
              {/* System Metrics Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: '15px',
                fontSize: '14px',
                color: '#ffffff',
                opacity: 0.9
              }}>
                <span>CPU: {systemHealth.cpuUsage || 0}%</span>
                <span>Memory: {systemHealth.memoryUsage || 0}%</span>
                <span>Response: {systemHealth.responseTime || 0}ms</span>
                <span>Backends: {systemHealth.activeBackends || 0}/{systemHealth.totalBackends || 3}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ 
              color: '#34d399', 
              marginBottom: '25px', 
              fontSize: '28px',
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(52, 211, 153, 0.4)'
            }}>
              👥 User Management
            </h2>
            <div style={{ color: '#fff', marginBottom: 12, fontWeight: 'bold', fontSize: 18 }}>
              Total Registered Users: {users.length}
            </div>
            <button onClick={openCreateUser} style={{ marginBottom: 16, padding: '8px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>+ Add User</button>
            <div style={{
              background: '#374151',
              borderRadius: '16px',
              overflowX: 'auto',
              border: '2px solid #475569',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              minWidth: 0,
              marginBottom: 16,
              maxWidth: '100%',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px,1fr) minmax(180px,2fr) minmax(80px,1fr) minmax(120px,1fr) minmax(120px,1fr) 120px',
                gap: '20px',
                padding: '20px 25px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0,0,0,0.3)',
                minWidth: 700,
              }}>
                <div>Username</div>
                <div>Email</div>
                <div>Role</div>
                <div>Created</div>
                <div>Last Login</div>
                <div>Actions</div>
              </div>

              {users.map(user => (
                <div key={user._id || user.id} style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px,1fr) minmax(180px,2fr) minmax(80px,1fr) minmax(120px,1fr) minmax(120px,1fr) 120px',
                  gap: '20px',
                  padding: '20px 25px',
                  borderBottom: '2px solid #4b5563',
                  fontSize: '16px',
                  alignItems: 'center',
                  minWidth: 700,
                }}>
                  <div style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{user.username}</div>
                  <div style={{ color: '#e2e8f0' }}>{user.email}</div>
                  <div style={{ color: user.role === 'admin' ? '#d0a128ff' : '#34d399', fontWeight: 'bold', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{user.role}</div>
                  <div style={{ color: '#cbd5e1' }}>{formatDate(user.createdAt)}</div>
                  <div style={{ color: '#cbd5e1' }}>{formatDate(user.lastLogin)}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '6px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => openEditUser(user)} title="Edit user">✏️</button>
                    {user.role !== 'admin' && (
                      <button style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => deleteUser(user._id || user.id)} title="Delete user">🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* User Form Modal */}
            {showUserForm && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <form onSubmit={handleUserFormSubmit} style={{ background: '#22223b', padding: 32, borderRadius: 16, minWidth: 350, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <h3 style={{ color: '#fff', margin: 0 }}>{editingUser ? 'Edit User' : 'Add User'}</h3>
                  <label style={{ color: '#fff' }}>
                    Username:
                    <input name="username" value={userForm.username} onChange={handleUserFormChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #475569', marginTop: 4 }} />
                  </label>
                  <label style={{ color: '#fff' }}>
                    Email:
                    <input name="email" type="email" value={userForm.email} onChange={handleUserFormChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #475569', marginTop: 4 }} />
                  </label>
                  <label style={{ color: '#fff' }}>
                    Password:
                    <input name="password" type="password" value={userForm.password} onChange={handleUserFormChange} required={!editingUser} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #475569', marginTop: 4 }} placeholder={editingUser ? '(Leave blank to keep current password)' : ''} />
                  </label>
                  <label style={{ color: '#fff' }}>
                    Role:
                    <select name="role" value={userForm.role} onChange={handleUserFormChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #475569', marginTop: 4 }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  {userFormError && (
                    <div style={{ color: '#ef4444', background: '#fee2e2', borderRadius: 6, padding: 8, fontWeight: 'bold', marginTop: 4, textAlign: 'center' }}>{userFormError}</div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, padding: '8px 18px', cursor: 'pointer' }}>{editingUser ? 'Update' : 'Create'}</button>
                    <button type="button" onClick={closeUserForm} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, padding: '8px 18px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workspaces' && (
          <div>
            <h2 style={{ 
              color: '#60a5fa', 
              marginBottom: '25px', 
              fontSize: '28px',
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(96, 165, 250, 0.4)'
            }}>
              📁 Workspace Management
            </h2>
            
            <div style={{ 
              background: '#374151',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid #475569',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Horizontal scroller for workspaces */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <button onClick={() => workspaceScrollerRef.current && (workspaceScrollerRef.current.scrollBy({ left: -300, behavior: 'smooth' }))} style={{ padding: '8px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer' }}>{'◀'}</button>
                <div ref={workspaceScrollerRef} style={{ overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 6, width: '100%' }}>
                  <div style={{ minWidth: '900px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', padding: '12px 16px', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', fontWeight: 'bold', fontSize: '16px', color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                      <div>Workspace Name</div>
                      <div>Owner</div>
                      <div>Created</div>
                      <div>Models</div>
                      <div>Datasets</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>

                    <div>
                      {workspaces.map(workspace => (
                        <div key={workspace.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', padding: '12px 16px', borderBottom: '2px solid #4b5563', fontSize: '15px' }}>
                          <div style={{ color: '#ffffff', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{workspace.name}</div>
                          <div style={{ color: '#e2e8f0' }}>{workspace.owner}</div>
                          <div style={{ color: '#cbd5e1' }}>{formatDate(workspace.createdAt)}</div>
                          <div style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold' }}>{workspace.modelsCount}</div>
                          <div style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold' }}>{workspace.datasetsCount}</div>
                          <div style={{ color: workspace.status === 'active' ? '#22c55e' : '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{workspace.status}</div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={() => toggleWorkspaceStatus(workspace.id, workspace.status)} style={{ background: workspace.status === 'active' ? '#f97316' : '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: '600' }} title={workspace.status === 'active' ? 'Deactivate workspace' : 'Activate workspace'}>{workspace.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                            <button onClick={() => deleteWorkspace(workspace.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: '600' }} title="Delete workspace">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => workspaceScrollerRef.current && (workspaceScrollerRef.current.scrollBy({ left: 300, behavior: 'smooth' }))} style={{ padding: '8px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer' }}>{'▶'}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <h2 style={{ 
              color: '#c084fc', 
              marginBottom: '25px', 
              fontSize: '28px',
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(192, 132, 252, 0.4)'
            }}>
              ⚙️ System Management
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '25px'
            }}>
              <div style={{
                padding: '25px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                borderRadius: '16px',
                border: '2px solid #c084fc',
                boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{ 
                  color: '#ffffff', 
                  marginBottom: '20px', 
                  fontSize: '22px',
                  fontWeight: 'bold',
                  textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  System Health
                </h3>
                <div>
                  <div style={{ 
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#e9d5ff', 
                      fontSize: '18px', 
                      fontWeight: 'bold'
                    }}>
                      Uptime:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {formatUptime(systemHealth.uptime)}
                    </span>
                  </div>
                  <div style={{ 
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#e9d5ff', 
                      fontSize: '18px', 
                      fontWeight: 'bold'
                    }}>
                      Storage Used:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {((systemHealth.memoryUsage || 0) * 4.2 / 100).toFixed(1)} GB
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#e9d5ff', 
                      fontSize: '18px', 
                      fontWeight: 'bold'
                    }}>
                      Total Datasets:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {workspaces.reduce((sum, w) => sum + (w.datasetsCount || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '25px',
                background: 'linear-gradient(135deg, #4320aaff 0%, #3b82f6 100%)',
                borderRadius: '16px',
                border: '2px solid #60a5fa',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{ 
                  color: '#ffffff', 
                  marginBottom: '20px', 
                  fontSize: '22px',
                  fontWeight: 'bold',
                  textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  Performance Metrics
                </h3>
                <div>
                  <div style={{ 
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#dbeafe', 
                      fontSize: '18px', 
                      fontWeight: 'bold'
                    }}>
                      API Requests:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {(realtimeMetrics.totalRequests || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ 
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#dbeafe', 
                      fontSize: '18px', 
                      fontWeight: 'bold'
                    }}>
                      Training Sessions:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {realtimeMetrics.totalTrainingSessions || 0}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#dbeafe', 
                      fontSize: '18px', 
                      fontWeight: 'bold'
                    }}>
                      Total Predictions:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {realtimeMetrics.totalPredictions || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;