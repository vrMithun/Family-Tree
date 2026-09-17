import React, { useMemo, useState } from 'react';
import { useFamily } from '../store/FamilyStore';
import { buildFamilyForest } from '../utils/treePathUtils';
import { FolderNode } from './FolderNode';
import { useModals } from './modals/ModalProvider';
import { ChevronsDown, ChevronsUp, Users, Folder, Layers, UserCheck, UserX, Activity } from 'lucide-react';
import './FamilyExplorer.css';

export function FamilyExplorer() {
  const { state } = useFamily();
  const { openModal } = useModals();

  const [globalExpandState, setGlobalExpandState] = useState(null);
  const [toggleCounter, setToggleCounter] = useState(0);

  const forest = useMemo(() => {
    return buildFamilyForest(state, state.generations || { familyGens: {}, personGens: {} });
  }, [state]);

  // Summary statistics - scoped to active project's families
  const stats = useMemo(() => {
    const families = Object.values(state.families || {});
    const memberships = state.familyMemberships || [];
    const parentChild = state.parentChild || [];
    const gens = state.generations || { familyGens: {}, personGens: {} };
    
    // Find all person IDs that belong to the active project's families
    const projectPersonIds = new Set();
    memberships.forEach(m => projectPersonIds.add(m.personId));
    parentChild.forEach(pc => projectPersonIds.add(pc.childId));
    
    const projectPeople = Array.from(projectPersonIds)
      .map(id => state.people[id])
      .filter(p => p && !p.isProxy);
    
    const totalMembers = projectPeople.length;
    const totalFamilies = families.length;
    
    const genValues = Object.values(gens.familyGens || {});
    const maxGeneration = genValues.length > 0 ? Math.max(...genValues) : 0;
    
    const maleCount = projectPeople.filter(p => p.gender === 'M').length;
    const femaleCount = projectPeople.filter(p => p.gender === 'F').length;
    
    const livingCount = projectPeople.filter(p => p.isAlive !== false && !p.deathDate).length;
    const deceasedCount = projectPeople.filter(p => p.isAlive === false || (p.deathDate && p.deathDate !== '')).length;

    return { totalMembers, totalFamilies, maxGeneration, maleCount, femaleCount, livingCount, deceasedCount };
  }, [state]);

  const handleExpandAll = () => {
    setGlobalExpandState('expand-all');
    setToggleCounter(c => c + 1);
  };

  const handleCollapseAll = () => {
    setGlobalExpandState('collapse-all');
    setToggleCounter(c => c + 1);
  };

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
        <div className="explorer-header-top">
          <h2 className="explorer-title">Family Tree</h2>
          <div className="explorer-actions">
            <button 
              className="btn btn-icon-label" 
              onClick={handleExpandAll}
              title="Expand All"
            >
              <ChevronsDown size={16} />
              <span className="btn-label-text">Expand All</span>
            </button>
            <button 
              className="btn btn-icon-label" 
              onClick={handleCollapseAll}
              title="Collapse All"
            >
              <ChevronsUp size={16} />
              <span className="btn-label-text">Collapse All</span>
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="stats-bar">
          <div className="stat-card">
            <Users size={16} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.totalMembers}</span>
              <span className="stat-label">Members</span>
            </div>
          </div>
          <div className="stat-card">
            <Folder size={16} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.totalFamilies}</span>
              <span className="stat-label">Families</span>
            </div>
          </div>
          <div className="stat-card">
            <Layers size={16} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.maxGeneration}</span>
              <span className="stat-label">Generations</span>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={16} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">
                {stats.maleCount}M / {stats.femaleCount}F
              </span>
              <span className="stat-label">Gender</span>
            </div>
          </div>
          <div className="stat-card">
            <UserCheck size={16} className="stat-icon stat-living" />
            <div className="stat-info">
              <span className="stat-value">{stats.livingCount}</span>
              <span className="stat-label">Living</span>
            </div>
          </div>
          <div className="stat-card">
            <UserX size={16} className="stat-icon stat-deceased" />
            <div className="stat-info">
              <span className="stat-value">{stats.deceasedCount}</span>
              <span className="stat-label">Deceased</span>
            </div>
          </div>
        </div>
      </div>

      <div className="explorer-content">
        {forest.map(treeNode => (
          <FolderNode 
            key={treeNode.familyId} 
            node={treeNode} 
            level={0}
            globalExpandState={globalExpandState}
            toggleCounter={toggleCounter}
            parentFamilyId={null}
            siblingIds={null}
          />
        ))}
      </div>
    </div>
  );
}
