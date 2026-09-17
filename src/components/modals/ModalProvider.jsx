import React, { createContext, useContext, useState, useCallback } from 'react';
import { MemberFormModal } from './MemberFormModal';
import { EditFamilyModal } from './EditFamilyModal';
import { DeleteFamilyModal } from './DeleteFamilyModal';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    targetFamilyId: null,
    targetPersonId: null
  });

  const openModal = useCallback((type, data = {}) => {
    setModalState({
      isOpen: true,
      type,
      ...data
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      
      {/* Render the active modal based on type */}
      {(modalState.type === 'edit-person' || modalState.type === 'add-child' || modalState.type === 'add-sibling' || modalState.type === 'add-spouse' || modalState.type === 'add-parent' || modalState.type === 'add-root') && (
        <MemberFormModal 
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode={modalState.type}
          targetFamilyId={modalState.targetFamilyId}
          targetPersonId={modalState.targetPersonId}
        />
      )}
      
      {modalState.type === 'edit-family' && (
        <EditFamilyModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          familyId={modalState.targetFamilyId}
        />
      )}
      
      {modalState.type === 'delete-family' && (
        <DeleteFamilyModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          familyId={modalState.targetFamilyId}
          hasChildren={modalState.hasChildren}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModals() {
  return useContext(ModalContext);
}
