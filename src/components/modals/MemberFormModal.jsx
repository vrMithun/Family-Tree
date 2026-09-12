import React, { useState } from 'react';
import { Modal } from '../Modal';
import { useFamily } from '../../store/FamilyStore';

export function MemberFormModal({ isOpen, onClose, mode, targetFamilyId, targetPersonId }) {
  const { state, dispatch } = useFamily();
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthPlace: '',
    gender: 'M',
    notes: '',
    isAlive: true,
    deathDate: ''
  });

  React.useEffect(() => {
    if (isOpen && mode === 'edit-person' && targetPersonId) {
      const person = state.people[targetPersonId];
      if (person) {
        setFormData({
          name: person.name || '',
          birthDate: person.birthDate || '',
          birthPlace: person.birthPlace || '',
          gender: person.gender || 'M',
          notes: person.notes || '',
          isAlive: person.isAlive !== undefined ? person.isAlive : true,
          deathDate: person.deathDate || ''
        });
      }
    } else if (isOpen) {
      setFormData({ name: '', birthDate: '', birthPlace: '', gender: 'M', notes: '', isAlive: true, deathDate: '' });
    }
  }, [isOpen, mode, targetPersonId, state.people]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'edit-person') {
      dispatch({
        type: 'EDIT_PERSON',
        payload: {
          id: targetPersonId,
          updates: formData
        }
      });
    } else if (mode === 'add-child') {
      dispatch({
        type: 'ADD_CHILD',
        payload: {
          parentFamilyId: targetFamilyId,
          person: formData
        }
      });
    } else if (mode === 'add-sibling') {
      dispatch({
        type: 'ADD_SIBLING',
        payload: {
          siblingFamilyId: targetFamilyId,
          person: formData
        }
      });
    } else if (mode === 'add-parent') {
      dispatch({
        type: 'ADD_PARENT',
        payload: {
          targetFamilyId,
          person: formData
        }
      });
    } else if (mode === 'add-spouse') {
      dispatch({
        type: 'ADD_SPOUSE',
        payload: {
          personAId: targetPersonId,
          newPerson: formData
        }
      });
    } else if (mode === 'add-root') {
      dispatch({
        type: 'ADD_ROOT',
        payload: {
          person: formData
        }
      });
    }
    
    onClose();
  };

  const getTitle = () => {
    if (mode === 'edit-person') return 'Edit Member Details';
    if (mode === 'add-child') return 'Add Child';
    if (mode === 'add-sibling') return 'Add Sibling';
    if (mode === 'add-spouse') return 'Add Spouse';
    if (mode === 'add-parent') return 'Add Parent';
    if (mode === 'add-root') return 'Add First Family Member';
    return 'Add Member';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            className="form-control" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
            autoFocus
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Gender</label>
            <select 
              className="form-control"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value})}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label>Birth Year</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.birthDate} 
              onChange={e => setFormData({...formData, birthDate: e.target.value})}
              placeholder="e.g. 1990"
            />
          </div>
        </div>
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <input 
            type="checkbox" 
            id="isAlive"
            checked={formData.isAlive} 
            onChange={e => setFormData({...formData, isAlive: e.target.checked})}
            style={{ width: 'auto' }}
          />
          <label htmlFor="isAlive" style={{ margin: 0 }}>This person is living</label>
        </div>

        {!formData.isAlive && (
          <div className="form-group">
            <label>Death Year</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.deathDate} 
              onChange={e => setFormData({...formData, deathDate: e.target.value})}
              placeholder="e.g. 2023"
            />
          </div>
        )}

        <div className="form-group">
          <label>Birth Place</label>
          <input 
            type="text" 
            className="form-control" 
            value={formData.birthPlace} 
            onChange={e => setFormData({...formData, birthPlace: e.target.value})}
            placeholder="City, Country"
          />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea 
            className="form-control" 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional information..."
            rows={3}
          />
        </div>
        
        <div className="modal-footer" style={{ display: 'flex', justifyContent: mode === 'edit-person' ? 'space-between' : 'flex-end' }}>
          {mode === 'edit-person' && (
            <button 
              type="button" 
              className="btn" 
              style={{ color: '#d13438', borderColor: '#d13438' }}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this member?')) {
                  dispatch({ type: 'DELETE_PERSON', payload: { id: targetPersonId } });
                  onClose();
                }
              }}
            >
              Delete Member
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{mode === 'edit-person' ? 'Save Changes' : 'Save Member'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
