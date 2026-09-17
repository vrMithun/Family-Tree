import React from 'react';
import { useFamily } from '../../store/FamilyStore';
import { X, Trash2 } from 'lucide-react';
import './Modal.css';

export function DeleteFamilyModal({ isOpen, onClose, familyId, hasChildren }) {
  const { dispatch } = useFamily();

  if (!isOpen) return null;

  const handleDeleteNodeOnly = () => {
    dispatch({ type: 'DELETE_FAMILY', payload: { id: familyId, deleteSubtree: false } });
    onClose();
  };

  const handleDeleteSubtree = () => {
    dispatch({ type: 'DELETE_FAMILY', payload: { id: familyId, deleteSubtree: true } });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <Trash2 size={20} className="text-danger" /> Delete Family
          </h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p>You are about to delete this family node.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-primary danger" onClick={handleDeleteSubtree}>
              Delete Entire Subtree (This family and all descendants)
            </button>
            <button className="btn btn-secondary" onClick={handleDeleteNodeOnly}>
              {hasChildren ? "Delete Only This Family (Replaces name with Unknown Person)" : "Delete Only This Family"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
