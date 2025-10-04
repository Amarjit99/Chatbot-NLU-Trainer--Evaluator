import React, { useState } from 'react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Simple mock data to avoid crashes
  const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', createdAt: '2024-01-01', lastLogin: '2024-01-15' },
    { id: 2, username: 'user1', email: 'user1@example.com', role: 'user', createdAt: '2024-01-05', lastLogin: '2024-01-14' },
    { id: 3, username: 'user2', email: 'user2@example.com', role: 'user', createdAt: '2024-01-10', lastLogin: '2024-01-13' }
  ];

  const mockWorkspaces = [
    { id: 1, name: 'HR Bot', owner: 'admin', createdAt: '2024-01-01', modelsCount: 3, datasetsCount: 5, status: 'active' },
    { id: 2, name: 'Travel Bot', owner: 'user1', createdAt: '2024-01-05', modelsCount: 2, datasetsCount: 3, status: 'active' },
    { id: 3, name: 'Support Bot', owner: 'user2', createdAt: '2024-01-10', modelsCount: 1, datasetsCount: 2, status: 'inactive' }
  ];

  const mockSystemStats = {
    totalUsers: 3,
    activeWorkspaces: 2,
    totalModels: 6,
    totalDatasets: 10,
    systemUptime: '15 days',
    apiRequests: 12547,
    storageUsed: '2.3 GB'
  };

  return (
    <div style={{ 
      padding: '25px', 
      background: 'linear-gradient(135deg, #46218cff 0%, #3e275fff 50%, #4c3a84ff 100%)',
      color: '#ffffff',
      minHeight: '100vh',
      borderRadius: '16px',
      margin: '10px',
      border: '2px solid #475569',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
    }}>
      <h1 style={{ 
        color: '#f7fbffff', 
        fontSize: '32px', 
        marginBottom: '25px',
        textAlign: 'center',
        fontWeight: 'bold',
        textShadow: '0 2px 10px rgba(96, 165, 250, 0.5)'
      }}>
        🛠️ Admin Dashboard
      </h1>

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

      {/* Content Area */}
      <div style={{ 
        padding: '30px',
        background: 'rgba(66, 53, 128, 0.9)',
        borderRadius: '16px',
        border: '2px solid #475569',
        minHeight: '500px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
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
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '25px',
              marginBottom: '35px'
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
                  {mockSystemStats.totalUsers}
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
                  {mockSystemStats.activeWorkspaces}
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
                  {mockSystemStats.totalModels}
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
                  {mockSystemStats.apiRequests.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              borderRadius: '12px',
              textAlign: 'center',
              border: '2px solid #34d399',
              boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)'
            }}>
              <p style={{ 
                margin: 0, 
                color: '#ffffff', 
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                ✅ System Status: Running Smoothly - Uptime: {mockSystemStats.systemUptime}
              </p>
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
            
            <div style={{ 
              background: '#374151',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid #475569',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '20px 25px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                <div>Username</div>
                <div>Email</div>
                <div>Role</div>
                <div>Created</div>
                <div>Last Login</div>
              </div>

              {mockUsers.map(user => (
                <div key={user.id} style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                  gap: '20px',
                  padding: '20px 25px',
                  borderBottom: '2px solid #4b5563',
                  fontSize: '16px'
                }}>
                  <div style={{ 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}>
                    {user.username}
                  </div>
                  <div style={{ color: '#e2e8f0' }}>{user.email}</div>
                  <div style={{ 
                    color: user.role === 'admin' ? '#d0a128ff' : '#34d399',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}>
                    {user.role}
                  </div>
                  <div style={{ color: '#cbd5e1' }}>{user.createdAt}</div>
                  <div style={{ color: '#cbd5e1' }}>{user.lastLogin}</div>
                </div>
              ))}
            </div>
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
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                gap: '18px',
                padding: '20px 25px',
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                <div>Workspace Name</div>
                <div>Owner</div>
                <div>Created</div>
                <div>Models</div>
                <div>Datasets</div>
                <div>Status</div>
              </div>

              {mockWorkspaces.map(workspace => (
                <div key={workspace.id} style={{ 
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '18px',
                  padding: '20px 25px',
                  borderBottom: '2px solid #4b5563',
                  fontSize: '16px'
                }}>
                  <div style={{ 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}>
                    {workspace.name}
                  </div>
                  <div style={{ color: '#e2e8f0' }}>{workspace.owner}</div>
                  <div style={{ color: '#cbd5e1' }}>{workspace.createdAt}</div>
                  <div style={{ 
                    color: '#ffffff', 
                    textAlign: 'center', 
                    fontWeight: 'bold'
                  }}>
                    {workspace.modelsCount}
                  </div>
                  <div style={{ 
                    color: '#ffffff', 
                    textAlign: 'center', 
                    fontWeight: 'bold'
                  }}>
                    {workspace.datasetsCount}
                  </div>
                  <div style={{ 
                    color: workspace.status === 'active' ? '#22c55e' : '#94a3b8',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}>
                    {workspace.status}
                  </div>
                </div>
              ))}
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
                      {mockSystemStats.systemUptime}
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
                      {mockSystemStats.storageUsed}
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
                      {mockSystemStats.totalDatasets}
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
                      {mockSystemStats.apiRequests.toLocaleString()}
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
                      Active Workspaces:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {mockSystemStats.activeWorkspaces}
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
                      Total Models:
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {mockSystemStats.totalModels}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;