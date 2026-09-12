import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { useFamily } from '../../store/FamilyStore';

export function EditFamilyModal({ isOpen, onClose, familyId }) {
  const { state, dispatch } = useFamily();
  const [formData, setFormData] = useState({
    displayName: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && familyId) {
      const family = state.families[familyId];
      if (family) {
        setFormData({
          displayName: family.displayName || '',
          notes: family.notes || ''
        });
      }
    }
  }, [isOpen, familyId, state]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'EDIT_FAMILY',
      payload: {
        id: familyId,
        updates: formData
      }
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Family">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Display Name</label>
          <input 
            type="text" 
            className="form-control" 
            value={formData.displayName} 
            onChange={e => setFormData({...formData, displayName: e.target.value})}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea 
            className="form-control" 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})}
            rows={4}
            placeholder="Add any family history or notes here..."
          />
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
