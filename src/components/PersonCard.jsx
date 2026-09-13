import React from 'react';
import { User, Heart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModals } from './modals/ModalProvider';
import { useFamily } from '../store/FamilyStore';
import './PersonCard.css';

export function PersonCard({ person, generation, spouse, isClickable }) {
  const navigate = useNavigate();
  const { openModal } = useModals();
  const { dispatch } = useFamily();
  
  if (!person) return null;
  
  const handleClick = () => {
    if (isClickable) {
      navigate(`/person/${person.id}/tree`);
    }
  };

  const isDeceased = person.isAlive === false;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
      dispatch({ type: 'DELETE_PERSON', payload: { id: person.id } });
    }
  };

  return (
    <div className={`person-card ${isClickable ? 'clickable' : ''} ${isDeceased ? 'deceased' : ''}`} onClick={handleClick}>
      <div className="person-header">
        <div className={`person-avatar ${person.gender === 'F' ? 'female' : 'male'} ${isDeceased ? 'deceased-avatar' : ''}`}>
          <User size={24} />
        </div>
        <div className="person-info">
          <h3 className="person-name">{person.name} {isDeceased && <span style={{fontSize: '12px', color: '#666'}}>(Deceased)</span>}</h3>
          <span className="person-dates">
            {person.birthDate} {isDeceased ? `– ${person.deathDate || 'Unknown'}` : '– Present'}
          </span>
        </div>
      </div>
      
      <div className="person-body">
        {generation && (
          <div className="person-meta">
            <span className="meta-label">Generation:</span>
            <span className="badge">G{generation}</span>
          </div>
        )}
        
        {spouse && (
          <div className="person-meta">
            <span className="meta-label">Spouse:</span>
            <span className="meta-value spouse-link">
              <Heart size={14} className="spouse-icon" />
              {spouse.name}
            </span>
          </div>
        )}
        
        {person.birthPlace && (
          <div className="person-meta">
            <span className="meta-label">Born in:</span>
            <span className="meta-value">{person.birthPlace}</span>
          </div>
        )}
        
        {person.notes && (
          <div className="person-meta" style={{ marginTop: '8px' }}>
            <span className="meta-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{person.notes}</span>
          </div>
        )}
      </div>
      
      <div className="person-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="btn btn-sm" 
          onClick={(e) => {
            e.stopPropagation();
            openModal('edit-person', { targetPersonId: person.id });
          }}
        >
          Edit Details
        </button>
        <button 
          className="btn btn-sm btn-danger" 
          title="Delete Member"
          style={{ backgroundColor: '#fee2e2', color: '#d13438', borderColor: '#fca5a5' }}
          onClick={handleDelete}
        >
          <Trash2 size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
          Delete
        </button>
      </div>
    </div>
  );
}
