import React, { useMemo } from 'react';
import { useFamily } from '../store/FamilyStore';
import { buildFamilyForest } from '../utils/treePathUtils';
import { FolderNode } from './FolderNode';
import { useModals } from './modals/ModalProvider';
import './FamilyExplorer.css';

export function FamilyExplorer() {
  const { state } = useFamily();

  const forest = useMemo(() => {
    return buildFamilyForest(state, state.generations || { familyGens: {}, personGens: {} });
  }, [state]);

  const { openModal } = useModals();

  if (!forest || forest.length === 0) {
    return (
      <div className="explorer-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>This family tree is currently empty.</p>
        <button className="btn btn-primary" onClick={() => openModal('add-root')}>Start Family Tree</button>
      </div>
    );
  }

  return (
    <div className="family-explorer">
      <div className="explorer-header">
        <h2 className="explorer-title">Family Tree</h2>
      </div>
      <div className="explorer-content">
        {forest.map(treeNode => (
          <FolderNode key={treeNode.familyId} node={treeNode} level={0} />
        ))}
      </div>
    </div>
  );
}
