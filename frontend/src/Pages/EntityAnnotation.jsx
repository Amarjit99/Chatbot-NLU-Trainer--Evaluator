import React, { useState, useRef, useEffect } from 'react';
import './EntityAnnotation.css';
import { FiTag, FiSave, FiPlus, FiTrash2, FiEdit3, FiCheck, FiX, FiCpu, FiInfo } from 'react-icons/fi';

const EntityAnnotation = ({ selectedWorkspace, data, onSave }) => {
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [entityTypes, setEntityTypes] = useState(['PERSON', 'LOCATION', 'ORGANIZATION', 'DATE', 'TIME', 'MONEY']);
  const [newEntityType, setNewEntityType] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isTrainingEntity, setIsTrainingEntity] = useState(false);
  const [entityModelInfo, setEntityModelInfo] = useState(null);
  const textRef = useRef(null);

  // Initialize annotations from existing data
  useEffect(() => {
    if (data && data.length > 0) {
      const initialAnnotations = data.map((item, index) => {
        // Normalize common dataset field names
        const text = item.text || item.utterance || item.sentence || '';
        const intent = item.intent || item.Intent || item.label || '';
        const entities = Array.isArray(item.entities) ? item.entities : [];

        return {
          id: index,
          text,
          intent,
          entities
        };
      });
      setAnnotations(initialAnnotations);
    }
  }, [data]);

  // Handle text selection for entity annotation
  const handleTextSelection = (annotationIndex) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selected = selection.toString().trim();
    if (!selected) return;

    // Compute start/end relative to the original plain text, not DOM nodes
    const annotation = annotations[annotationIndex];
    if (!annotation || typeof annotation.text !== 'string') return;

    const text = annotation.text;
    const lowerText = text.toLowerCase();
    const lowerSel = selected.toLowerCase();

    // Collect all candidate occurrences of the selected text
    const candidates = [];
    let from = 0;
    while (true) {
      const pos = lowerText.indexOf(lowerSel, from);
      if (pos === -1) break;
      candidates.push({ start: pos, end: pos + selected.length });
      from = pos + 1; // allow overlapping occurrences by moving one char
    }

    // Helper to check overlap with existing entities
    const overlaps = (a, b) => !(a.end <= b.start || a.start >= b.end);

    // Prefer the first candidate that doesn't overlap an existing entity
    let chosen = candidates.find(range =>
      Array.isArray(annotation.entities)
        ? !annotation.entities.some(e => overlaps(range, e))
        : true
    );

    // Fallback: if none found (or duplicates everywhere), use the first candidate
    if (!chosen && candidates.length > 0) {
      chosen = candidates[0];
    }

    if (chosen) {
      setSelectedText(selected);
      setSelectionRange({ annotationIndex, start: chosen.start, end: chosen.end });
    }
  };

  // Add entity annotation
  const addEntityAnnotation = () => {
    if (!selectedText || !selectedEntityType || !selectionRange) {
      alert('Please select text and choose an entity type');
      return;
    }

    const newEntity = {
      text: selectedText,
      label: selectedEntityType,
      start: selectionRange.start,
      end: selectionRange.end,
      id: Date.now()
    };

    setAnnotations(prev => prev.map((annotation, index) => {
      if (index === selectionRange.annotationIndex) {
        return {
          ...annotation,
          entities: [...(annotation.entities || []), newEntity]
        };
      }
      return annotation;
    }));

    // Clear selection
    setSelectedText('');
    setSelectionRange(null);
    setSelectedEntityType('');
    window.getSelection().removeAllRanges();
  };

  // Remove entity annotation
  const removeEntity = (annotationIndex, entityId) => {
    setAnnotations(prev => prev.map((annotation, index) => {
      if (index === annotationIndex) {
        return {
          ...annotation,
          entities: annotation.entities.filter(entity => entity.id !== entityId)
        };
      }
      return annotation;
    }));
  };

  // Add new entity type
  const addEntityType = () => {
    if (newEntityType.trim() && !entityTypes.includes(newEntityType.trim().toUpperCase())) {
      setEntityTypes(prev => [...prev, newEntityType.trim().toUpperCase()]);
      setNewEntityType('');
    }
  };

  // Highlight entities in text
  const highlightEntities = (text, entities = []) => {
    if (!entities.length) return text;

    // Sort entities by start position to avoid overlapping issues
    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);
    
    let result = [];
    let lastIndex = 0;

    sortedEntities.forEach((entity, index) => {
      // Add text before entity
      if (entity.start > lastIndex) {
        result.push(text.substring(lastIndex, entity.start));
      }
      
      // Add highlighted entity
      result.push(
        <span 
          key={`entity-${index}`} 
          className={`entity-highlight entity-${entity.label.toLowerCase()}`}
          title={entity.label}
        >
          {text.substring(entity.start, entity.end)}
          <span className="entity-label">{entity.label}</span>
        </span>
      );
      
      lastIndex = entity.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }

    return result;
  };

  // Save annotations
  const handleSave = async () => {
    if (!selectedWorkspace) {
      alert('Please select a workspace first');
      return;
    }

    // Basic client-side validation to prevent backend 400/500s
    const invalid = annotations.find((a, idx) => !a || !a.text || !a.text.trim() || !a.intent || !a.intent.trim());
    if (invalid) {
      alert('Each annotation must have non-empty text and intent before saving.');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/entities/save-annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          annotations: annotations
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Entity annotations saved successfully! ${result.totalSamples} samples with ${result.totalEntities} entities`);
        
        if (onSave) {
          onSave(annotations);
        }
      } else {
        let error = {};
        try { error = await response.json(); } catch {}
        const detail = error?.error ? ` - ${error.error}` : '';
        alert(`Failed to save annotations: ${error?.message || 'Unknown error'}${detail}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save entity annotations. Please try again.');
    }
  };

  // Train entity recognition model
  const trainEntityModel = async () => {
    if (!selectedWorkspace) {
      alert('Please select a workspace first');
      return;
    }

    if (annotations.length === 0) {
      alert('Please create entity annotations first');
      return;
    }

    setIsTrainingEntity(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/entities/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setEntityModelInfo(result);
        alert(`Entity model trained successfully! Supports ${result.entityTypes.length} entity types with ${result.trainingExamples} training samples`);
      } else {
        let error = {};
        try { error = await response.json(); } catch {}
        const detail = error?.error ? ` - ${error.error}` : '';
        alert(`Failed to train entity model: ${error?.message || 'Unknown error'}${detail}`);
      }
    } catch (error) {
      console.error('Training error:', error);
      alert('Failed to train entity model. Please try again.');
    } finally {
      setIsTrainingEntity(false);
    }
  };

  return (
    <div className="entity-annotation-container">
      <div className="annotation-header">
        <h3><FiTag /> Entity Annotation Interface</h3>
        <p>Select text in the samples below to annotate entities</p>
      </div>

      {/* Entity Types Management */}
      <div className="entity-types-section">
        <div className="section-title">Entity Types</div>
        <div className="entity-types-list">
          {entityTypes.map(type => (
            <span 
              key={type} 
              className={`entity-type-chip ${selectedEntityType === type ? 'selected' : ''}`}
              onClick={() => setSelectedEntityType(type)}
            >
              {type}
            </span>
          ))}
        </div>
        <div className="add-entity-type">
          <input
            type="text"
            placeholder="New entity type"
            value={newEntityType}
            onChange={(e) => setNewEntityType(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addEntityType()}
          />
          <button onClick={addEntityType}>
            <FiPlus /> Add
          </button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedText && (
        <div className="selection-info">
          <span>Selected: "{selectedText}"</span>
          <select 
            value={selectedEntityType} 
            onChange={(e) => setSelectedEntityType(e.target.value)}
          >
            <option value="">Choose entity type</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={addEntityAnnotation} disabled={!selectedEntityType}>
            <FiTag /> Annotate
          </button>
        </div>
      )}

      {/* Annotations List */}
      <div className="annotations-list">
        <div className="section-title">Training Data with Entity Annotations</div>
        {annotations.length === 0 ? (
          <div className="no-data">
            <FiEdit3 size={48} />
            <p>No training data available for annotation</p>
            <p>Please upload training data in the Training tab first</p>
          </div>
        ) : (
          annotations.map((annotation, index) => (
            <div key={index} className="annotation-item">
              <div className="annotation-header-item">
                <strong>Sample {index + 1}</strong>
                <span className="intent-badge">Intent: {annotation.intent}</span>
              </div>
              
              <div 
                className="annotation-text"
                ref={textRef}
                onMouseUp={() => handleTextSelection(index)}
              >
                {highlightEntities(annotation.text, annotation.entities)}
              </div>

              {annotation.entities && annotation.entities.length > 0 && (
                <div className="entities-list">
                  <div className="entities-title">Entities:</div>
                  {annotation.entities.map(entity => (
                    <div key={entity.id} className="entity-item">
                      <span className="entity-text">"{entity.text}"</span>
                      <span className={`entity-label-badge entity-${entity.label.toLowerCase()}`}>
                        {entity.label}
                      </span>
                      <button 
                        className="remove-entity"
                        onClick={() => removeEntity(index, entity.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Entity Model Information */}
      {entityModelInfo && (
        <div className="entity-model-info">
          <div className="section-title"><FiInfo /> Entity Model Information</div>
          <div className="model-stats">
            <div className="stat-item">
              <strong>Entity Types:</strong> {entityModelInfo.entityTypes.join(', ')}
            </div>
            <div className="stat-item">
              <strong>Training Examples:</strong> {entityModelInfo.trainingExamples}
            </div>
            <div className="stat-item">
              <strong>Total Entities:</strong> {entityModelInfo.totalEntities}
            </div>
            <div className="stat-item">
              <strong>Patterns:</strong> {entityModelInfo.patterns}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {annotations.length > 0 && (
        <div className="action-section">
          <button className="save-button" onClick={handleSave}>
            <FiSave /> Save Entity Annotations
          </button>
          <button 
            className="train-button" 
            onClick={trainEntityModel}
            disabled={isTrainingEntity}
          >
            {isTrainingEntity ? (
              <>Training...</>
            ) : (
              <><FiCpu /> Train Entity Model</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EntityAnnotation;