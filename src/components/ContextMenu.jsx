import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, UserPlus, Link as LinkIcon, Edit, FolderInput, Archive } from 'lucide-react';
import { useModals } from './modals/ModalProvider';
import './ContextMenu.css';

export function ContextMenu({ familyId }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { openModal } = useModals();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action, e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    
    if (action === 'edit') {
      openModal('edit-family', { targetFamilyId: familyId });
    } else if (action === 'add-child') {
      openModal('add-child', { targetFamilyId: familyId });
    } else if (action === 'add-sibling') {
      openModal('add-sibling', { targetFamilyId: familyId });
    } else if (action === 'add-parent') {
      openModal('add-parent', { targetFamilyId: familyId });
    }
    // More actions can be added later (archive, move, add-spouse)
  };

  return (
    <div className="context-menu-container" ref={menuRef}>
      <button 
        className="btn-icon context-trigger" 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      >
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <div className="context-menu-dropdown">
          <div className="context-menu-item" onClick={(e) => handleAction('edit', e)}>
            <Edit size={14} />
            <span>Edit Family</span>
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={(e) => handleAction('add-parent', e)}>
            <FolderInput size={14} />
            <span>Add Parent</span>
          </div>
          <div className="context-menu-item" onClick={(e) => handleAction('add-child', e)}>
            <UserPlus size={14} />
            <span>Add Child</span>
          </div>
          <div className="context-menu-item" onClick={(e) => handleAction('add-sibling', e)}>
            <LinkIcon size={14} />
            <span>Add Sibling</span>
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item danger" onClick={(e) => handleAction('archive', e)}>
            <Archive size={14} />
            <span>Archive</span>
          </div>
        </div>
      )}
    </div>
  );
}
