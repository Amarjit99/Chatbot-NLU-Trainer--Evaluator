import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
  FiRefreshCw,
  FiUpload,
  FiSend,
  FiEdit3,
  FiTrendingUp,
  FiTarget,
  FiBookOpen,
  FiSettings
} from 'react-icons/fi';
import './ActiveLearningDashboard.css';

const ActiveLearningDashboard = ({ selectedWorkspace, modelInfo }) => {
  const [uncertainSamples, setUncertainSamples] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  
  // Analysis settings
  const [analysisSettings, setAnalysisSettings] = useState({
    confidenceThreshold: 0.7,
    uncertaintyMethod: 'entropy',
    maxSamples: 50,
    minConfidenceGap: 0.2
  });

  // Test data upload
  const [testFile, setTestFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Feedback state
  const [pendingFeedback, setPendingFeedback] = useState({});
  const [selectedSamples, setSelectedSamples] = useState(new Set());

  useEffect(() => {
    if (selectedWorkspace) {
      loadUncertainSamples();
      loadFeedbackHistory();
      loadStatistics();
    }
  }, [selectedWorkspace]);

  const loadUncertainSamples = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/active-learning/uncertain-samples/${selectedWorkspace.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setUncertainSamples(response.data.samples || []);
    } catch (error) {
      console.error('Failed to load uncertain samples:', error);
    }
  };

  const loadFeedbackHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/active-learning/feedback-history/${selectedWorkspace.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setFeedbackHistory(response.data.feedback || []);
    } catch (error) {
      console.error('Failed to load feedback history:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/active-learning/statistics/${selectedWorkspace.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleTestFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTestFile(file);
    }
  };

  const analyzeUncertainty = async () => {
    if (!testFile) {
      alert('Please upload test data file first');
      return;
    }

    if (!modelInfo) {
      alert('Please ensure a model is trained first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const fileContent = await testFile.text();
      const testData = JSON.parse(fileContent);

      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/active-learning/analyze',
        {
          workspaceId: selectedWorkspace.id,
          testData: testData,
          settings: analysisSettings
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setAnalysisResult(response.data.result);
      await loadUncertainSamples();
      await loadStatistics();
      alert(`Analysis complete! Found ${response.data.result.uncertainSamples.length} uncertain samples`);

    } catch (error) {
      console.error('Uncertainty analysis error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Failed to analyze uncertainty: ${errorMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedbackChange = (sampleId, field, value) => {
    setPendingFeedback(prev => ({
      ...prev,
      [sampleId]: {
        ...prev[sampleId],
        [field]: value
      }
    }));
  };

  const submitFeedback = async () => {
    const feedbackEntries = Object.entries(pendingFeedback)
      .filter(([sampleId, feedback]) => feedback.correctedIntent && feedback.correctedIntent.trim())
      .map(([sampleId, feedback]) => {
        const sample = uncertainSamples.find(s => s.id === sampleId);
        return {
          sampleId,
          text: sample.text,
          correctedIntent: feedback.correctedIntent.trim(),
          originalPrediction: sample.predictedIntent,
          originalConfidence: sample.confidence,
          feedbackType: 'correction',
          notes: feedback.notes || ''
        };
      });

    if (feedbackEntries.length === 0) {
      alert('Please provide corrections for at least one sample');
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/active-learning/feedback',
        {
          workspaceId: selectedWorkspace.id,
          feedback: feedbackEntries
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      alert(`Feedback submitted! Processed ${response.data.processedFeedback} corrections`);
      setPendingFeedback({});
      setSelectedSamples(new Set());
      await loadUncertainSamples();
      await loadFeedbackHistory();
      await loadStatistics();

    } catch (error) {
      console.error('Feedback submission error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Failed to submit feedback: ${errorMsg}`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const retrainWithFeedback = async () => {
    if (feedbackHistory.length === 0) {
      alert('No feedback available for retraining. Please provide corrections first.');
      return;
    }

    setIsRetraining(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/active-learning/retrain',
        {
          workspaceId: selectedWorkspace.id,
          includeOriginalData: true
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      alert('Model retrained successfully with feedback corrections!');
      console.log('Retraining result:', response.data);

    } catch (error) {
      console.error('Retraining error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Failed to retrain model: ${errorMsg}`);
    } finally {
      setIsRetraining(false);
    }
  };

  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(1) + '%';
  };

  const getUncertaintyColor = (score) => {
    if (score > 0.7) return '#e74c3c';
    if (score > 0.5) return '#f39c12';
    return '#f1c40f';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return '#27ae60';
    if (confidence > 0.6) return '#f39c12';
    return '#e74c3c';
  };

  if (!selectedWorkspace) {
    return (
      <div className="active-learning-dashboard">
        <div className="no-workspace">
          <FiTarget size={48} />
          <h3>No Workspace Selected</h3>
          <p>Please select a workspace to access active learning features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="active-learning-dashboard">
      <div className="dashboard-header">
        <h2><FiActivity /> Active Learning Dashboard</h2>
        <p>Identify uncertain predictions and improve model performance through feedback</p>
      </div>

      <div className="dashboard-content">
        {/* Statistics Overview */}
        {statistics && (
          <div className="statistics-section">
            <h3><FiBarChart2 /> Active Learning Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FiAlertTriangle /></div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.uncertainSamples.total}</div>
                  <div className="stat-label">Uncertain Samples</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiClock /></div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.uncertainSamples.pending}</div>
                  <div className="stat-label">Pending Review</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiCheckCircle /></div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.feedback.total}</div>
                  <div className="stat-label">Feedback Given</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiTrendingUp /></div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.feedback.feedbackRate}%</div>
                  <div className="stat-label">Review Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Section */}
        <div className="analysis-section">
          <h3><FiTarget /> Uncertainty Analysis</h3>
          
          <div className="analysis-controls">
            <div className="control-group">
              <label>Test Data File:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleTestFileUpload}
                className="file-input"
              />
              {testFile && (
                <div className="file-info">
                  Selected: {testFile.name} ({(testFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="settings-grid">
              <div className="setting-item">
                <label>Confidence Threshold:</label>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.1"
                  value={analysisSettings.confidenceThreshold}
                  onChange={(e) => setAnalysisSettings(prev => ({
                    ...prev,
                    confidenceThreshold: parseFloat(e.target.value)
                  }))}
                />
                <span>{analysisSettings.confidenceThreshold}</span>
              </div>

              <div className="setting-item">
                <label>Uncertainty Method:</label>
                <select
                  value={analysisSettings.uncertaintyMethod}
                  onChange={(e) => setAnalysisSettings(prev => ({
                    ...prev,
                    uncertaintyMethod: e.target.value
                  }))}
                >
                  <option value="entropy">Entropy</option>
                  <option value="confidence">Confidence</option>
                  <option value="margin">Margin</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Max Samples:</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={analysisSettings.maxSamples}
                  onChange={(e) => setAnalysisSettings(prev => ({
                    ...prev,
                    maxSamples: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>

            <button
              className="analyze-btn primary"
              onClick={analyzeUncertainty}
              disabled={isAnalyzing || !testFile || !modelInfo}
            >
              {isAnalyzing ? <FiRefreshCw className="spinning" /> : <FiTarget />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Uncertainty'}
            </button>
          </div>

          {analysisResult && (
            <div className="analysis-results">
              <h4>Analysis Results</h4>
              <div className="results-grid">
                <div className="result-item">
                  <strong>Total Predictions:</strong> {analysisResult.analysis.totalPredictions}
                </div>
                <div className="result-item">
                  <strong>Uncertain Samples:</strong> {analysisResult.analysis.uncertainSamples}
                </div>
                <div className="result-item">
                  <strong>Average Confidence:</strong> {formatConfidence(analysisResult.analysis.averageConfidence)}
                </div>
                <div className="result-item">
                  <strong>Low Confidence:</strong> {analysisResult.analysis.lowConfidenceSamples}
                </div>
              </div>
              
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div className="recommendations">
                  <h5>Recommendations:</h5>
                  <ul>
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Uncertain Samples Section */}
        {uncertainSamples.length > 0 && (
          <div className="uncertain-samples-section">
            <div className="section-header">
              <h3><FiAlertTriangle /> Uncertain Samples for Review</h3>
              <div className="section-actions">
                <button
                  className="feedback-btn"
                  onClick={submitFeedback}
                  disabled={isSubmittingFeedback || Object.keys(pendingFeedback).length === 0}
                >
                  {isSubmittingFeedback ? <FiRefreshCw className="spinning" /> : <FiSend />}
                  Submit Feedback
                </button>
              </div>
            </div>

            <div className="samples-list">
              {uncertainSamples.slice(0, 20).map((sample, index) => (
                <div key={sample.id} className="sample-item">
                  <div className="sample-header">
                    <div className="sample-info">
                      <span className="sample-number">#{index + 1}</span>
                      <span 
                        className="uncertainty-badge"
                        style={{ backgroundColor: getUncertaintyColor(sample.uncertaintyScore) }}
                      >
                        {sample.reason}
                      </span>
                      <span className="uncertainty-score">
                        Uncertainty: {(sample.uncertaintyScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="confidence-info">
                      <span 
                        className="confidence-badge"
                        style={{ color: getConfidenceColor(sample.confidence) }}
                      >
                        {formatConfidence(sample.confidence)}
                      </span>
                    </div>
                  </div>

                  <div className="sample-content">
                    <div className="sample-text">
                      <strong>Text:</strong> {sample.text}
                    </div>
                    <div className="prediction-info">
                      <strong>Predicted Intent:</strong> {sample.predictedIntent}
                    </div>
                  </div>

                  <div className="feedback-controls">
                    <div className="correction-input">
                      <label>Correct Intent:</label>
                      <input
                        type="text"
                        placeholder="Enter correct intent..."
                        value={pendingFeedback[sample.id]?.correctedIntent || ''}
                        onChange={(e) => handleFeedbackChange(sample.id, 'correctedIntent', e.target.value)}
                      />
                    </div>
                    <div className="notes-input">
                      <label>Notes (optional):</label>
                      <input
                        type="text"
                        placeholder="Additional notes..."
                        value={pendingFeedback[sample.id]?.notes || ''}
                        onChange={(e) => handleFeedbackChange(sample.id, 'notes', e.target.value)}
                      />
                    </div>
                  </div>

                  {sample.status === 'reviewed' && (
                    <div className="reviewed-status">
                      <FiCheckCircle className="reviewed-icon" />
                      <span>Reviewed - Corrected to: {sample.correctedIntent}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {uncertainSamples.length > 20 && (
              <div className="samples-pagination">
                <p>Showing 20 of {uncertainSamples.length} uncertain samples</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback History Section */}
        {feedbackHistory.length > 0 && (
          <div className="feedback-history-section">
            <h3><FiBookOpen /> Recent Feedback History</h3>
            <div className="feedback-list">
              {feedbackHistory.slice(-10).map((feedback, index) => (
                <div key={index} className="feedback-item">
                  <div className="feedback-content">
                    <div className="feedback-text">
                      <strong>Text:</strong> {feedback.originalText}
                    </div>
                    <div className="feedback-correction">
                      <span className="original">Original: {feedback.originalPrediction}</span>
                      <span className="arrow">→</span>
                      <span className="corrected">Corrected: {feedback.correctedIntent}</span>
                    </div>
                  </div>
                  <div className="feedback-meta">
                    <div className="feedback-date">
                      {new Date(feedback.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retraining Section */}
        {feedbackHistory.length > 0 && (
          <div className="retraining-section">
            <h3><FiRefreshCw /> Model Retraining</h3>
            <div className="retraining-info">
              <p>
                You have {feedbackHistory.length} feedback corrections available for model improvement.
                Retraining will incorporate these corrections to improve model accuracy.
              </p>
              <button
                className="retrain-btn primary"
                onClick={retrainWithFeedback}
                disabled={isRetraining}
              >
                {isRetraining ? <FiRefreshCw className="spinning" /> : <FiTrendingUp />}
                {isRetraining ? 'Retraining...' : 'Retrain with Feedback'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveLearningDashboard;