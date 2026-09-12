import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFamily } from '../store/FamilyStore';
import { buildFamilyForest } from '../utils/treePathUtils';
import { FolderNode } from './FolderNode';
import { ArrowLeft } from 'lucide-react';
import './FamilyExplorer.css';

export function CustomFamilyTree() {
  const { id } = useParams();
  const { state } = useFamily();
  
  const person = state.people[id];

  // Find the parent family to use as root
  const rootFamilyId = useMemo(() => {
    if (!person) return null;
    
    // Find the family where this person is a child
    const parentRel = state.parentChild.find(pc => pc.childId === id);
    if (parentRel) {
      return parentRel.parentFamilyId;
    }
    
    // If they have no parent (e.g. they are the absolute root like Ramasamy)
    // Then just use the family where they are a parent
    const selfRel = state.familyMemberships?.find(m => m.personId === id && m.role === 'parent');
    return selfRel ? selfRel.familyId : state.tree?.rootFamilyId;
  }, [state, id, person]);

  const forest = useMemo(() => {
    if (!rootFamilyId) return null;
    return buildFamilyForest(state, state.generations || { familyGens: {}, personGens: {} }, rootFamilyId);
  }, [state, rootFamilyId]);

  if (!person) {
    return <div className="explorer-empty">Person not found.</div>;
  }

  if (!forest || forest.length === 0) {
    return <div className="explorer-empty">No family tree data found for this person.</div>;
  }

  return (
    <div className="family-explorer">
      <div className="explorer-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/members" className="btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <h2 className="explorer-title">Subtree view for {person.name}</h2>
      </div>
      <div className="explorer-content">
        {forest.map(treeNode => (
          <FolderNode key={treeNode.familyId} node={treeNode} level={0} />
        ))}
      </div>
    </div>
  );
}
