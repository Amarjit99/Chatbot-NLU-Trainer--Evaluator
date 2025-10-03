import React, { useState, useEffect } from 'react';
import './BackendSelection.css';
import { 
  FiCpu, 
  FiCheckCircle, 
  FiXCircle, 
  FiSettings,
  FiInfo,
  FiRefreshCw,
  FiBarChart3,
  FiClock
} from 'react-icons/fi';

const BackendSelection = ({ 
  selectedBackends = ['huggingface', 'rasa', 'spacy'], 
  onSelectionChange = () => {}, 
  workspaceId = null,
  className = ''
}) => {
  const [backends, setBackends] = useState(['huggingface', 'rasa', 'spacy']);
  const [availability, setAvailability] = useState({
    huggingface: true,
    rasa: true,
    spacy: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const backendInfo = {
    huggingface: {
      name: 'HuggingFace',
      description: 'Advanced transformer-based NLU with pre-trained models',
      icon: '🤗',
      features: ['Transformer Models', 'Pre-trained', 'High Accuracy', 'Cloud-based'],
      pros: ['State-of-the-art accuracy', 'Easy to use', 'No local setup'],
      cons: ['Requires internet', 'API rate limits']
    },
    rasa: {
      name: 'Rasa',
      description: 'Open-source conversational AI framework',
      icon: '🤖',
      features: ['Open Source', 'Customizable', 'Pipeline Control', 'Local Training'],
      pros: ['Full control', 'Customizable pipelines', 'Offline capable'],
      cons: ['Complex setup', 'Resource intensive']
    },
    spacy: {
      name: 'spaCy',
      description: 'Industrial-strength Natural Language Processing',
      icon: '🐍',
      features: ['Fast Processing', 'Production Ready', 'Multi-language', 'Lightweight'],
      pros: ['Very fast', 'Lightweight', 'Good for production'],
      cons: ['Limited deep learning', 'Requires training data']
    }
  };

  // No useEffect needed - component is initialized with stable defaults

  const fetchBackendInfo = () => {
    // Refresh function - data already initialized
    console.log('Backend info refreshed');
  };

  const handleBackendToggle = (backend) => {
    let newSelection;
    if (selectedBackends.includes(backend)) {
      // Remove backend (but ensure at least one is selected)
      newSelection = selectedBackends.filter(b => b !== backend);
      if (newSelection.length === 0) {
        // Keep at least one backend selected
        return;
      }
    } else {
      // Add backend
      newSelection = [...selectedBackends, backend];
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const availableBackends = backends.filter(backend => availability[backend]);
    onSelectionChange(availableBackends);
  };

  const handleSelectNone = () => {
    // Keep at least one backend
    if (backends.length > 0) {
      const firstAvailable = backends.find(backend => availability[backend]) || backends[0];
      onSelectionChange([firstAvailable]);
    }
  };

  const getBackendStatus = (backend) => {
    const isAvailable = availability[backend];
    const isSelected = selectedBackends.includes(backend);
    
    return {
      available: isAvailable,
      selected: isSelected,
      disabled: !isAvailable
    };
  };

  if (loading) {
    return (
      <div className={`backend-selection loading ${className}`}>
        <div className="loading-content">
          <FiRefreshCw className="spin" />
          <span>Loading backend information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`backend-selection ${className}`}>
      <div className="backend-selection-header">
        <h3>
          <FiCpu className="icon" />
          NLU Backend Selection
        </h3>
        <div className="header-actions">
          <button 
            className="btn-secondary small"
            onClick={() => setShowDetails(!showDetails)}
          >
            <FiInfo />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button 
            className="btn-secondary small"
            onClick={fetchBackendInfo}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <FiXCircle />
          {error}
        </div>
      )}

      <div className="selection-controls">
        <span className="selection-count">
          {selectedBackends.length} of {backends.length} backends selected
        </span>
        <div className="selection-buttons">
          <button 
            className="btn-link"
            onClick={handleSelectAll}
          >
            Select All Available
          </button>
          <button 
            className="btn-link"
            onClick={handleSelectNone}
            disabled={selectedBackends.length <= 1}
          >
            Select Minimum
          </button>
        </div>
      </div>

      <div className="backends-grid">
        {backends.map(backend => {
          const status = getBackendStatus(backend);
          const info = backendInfo[backend] || {
            name: backend,
            description: 'NLU Backend',
            icon: '🤖',
            features: []
          };

          return (
            <div 
              key={backend}
              className={`backend-card ${status.selected ? 'selected' : ''} ${status.disabled ? 'disabled' : ''}`}
              onClick={() => !status.disabled && handleBackendToggle(backend)}
            >
              <div className="backend-header">
                <div className="backend-info">
                  <span className="backend-icon">{info.icon}</span>
                  <div className="backend-title">
                    <h4>{info.name}</h4>
                    <div className="backend-status">
                      {status.available ? (
                        <span className="status-available">
                          <FiCheckCircle />
                          Available
                        </span>
                      ) : (
                        <span className="status-unavailable">
                          <FiXCircle />
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="selection-indicator">
                  {status.selected && (
                    <FiCheckCircle className="selected-icon" />
                  )}
                </div>
              </div>

              {showDetails && (
                <div className="backend-details">
                  <p className="description">{info.description}</p>
                  
                  {info.features && Array.isArray(info.features) && info.features.length > 0 && (
                    <div className="features">
                      <strong>Features:</strong>
                      <ul>
                        {info.features.map((feature, index) => (
                          <li key={index}>{feature || 'Feature'}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pros-cons">
                    {info.pros && Array.isArray(info.pros) && info.pros.length > 0 && (
                      <div className="pros">
                        <strong>Pros:</strong>
                        <ul>
                          {info.pros.map((pro, index) => (
                            <li key={index}>{pro || 'Advantage'}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {info.cons && Array.isArray(info.cons) && info.cons.length > 0 && (
                      <div className="cons">
                        <strong>Cons:</strong>
                        <ul>
                          {info.cons.map((con, index) => (
                            <li key={index}>{con || 'Disadvantage'}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedBackends.length > 1 && (
        <div className="multi-backend-info">
          <div className="info-box">
            <FiBarChart3 className="icon" />
            <div className="info-content">
              <strong>Multi-Backend Training Enabled</strong>
              <p>
                Training will use all selected backends and provide consensus predictions. 
                You can compare performance and accuracy across different NLU engines.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="backend-recommendations">
        <h4>💡 Recommendations</h4>
        <ul>
          <li><strong>Single Backend:</strong> Use HuggingFace for quick setup and high accuracy</li>
          <li><strong>Multiple Backends:</strong> Combine 2-3 backends for consensus predictions</li>
          <li><strong>Production:</strong> Consider Rasa or spaCy for offline deployment</li>
          <li><strong>Experimentation:</strong> Use all available backends to compare performance</li>
        </ul>
      </div>
    </div>
  );
};

export default BackendSelection;