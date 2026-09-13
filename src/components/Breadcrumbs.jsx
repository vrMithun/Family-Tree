import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFamily } from '../store/FamilyStore';
import { getPathToRoot } from '../utils/treePathUtils';
import './Breadcrumbs.css';

export function Breadcrumbs() {
  const { state } = useFamily();
  const location = useLocation();
  
  // Parse current route
  const isDashboard = location.pathname === '/';
  const isTree = location.pathname === '/tree';
  const isMembers = location.pathname === '/members';
  const personMatch = location.pathname.match(/\/person\/(.+)\/tree/);
  const familyMatch = location.pathname.match(/\/family\/(.+)/);
  
  const currentFamilyId = familyMatch ? familyMatch[1] : null;

  let pathIds = [];
  if (currentFamilyId) {
    pathIds = getPathToRoot(state, currentFamilyId);
  } else if (isTree) {
    // Only show root path if on the main explorer
    pathIds = state.tree?.rootFamilyId ? [state.tree.rootFamilyId] : [];
  }

  return (
    <nav className="breadcrumbs">
      <Link to="/" className="breadcrumb-link">Dashboard</Link>
      
      {!isDashboard && (
        <React.Fragment>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <Link to="/tree" className="breadcrumb-link">Family Tree</Link>
        </React.Fragment>
      )}
      
      {isMembers && (
        <React.Fragment>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-link" style={{color: 'var(--text-primary)'}}>Members</span>
        </React.Fragment>
      )}

      {personMatch && (
        <React.Fragment>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <Link to="/members" className="breadcrumb-link">Members</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-link" style={{color: 'var(--text-primary)'}}>
            {state.people[personMatch[1]]?.name} (Subtree)
          </span>
        </React.Fragment>
      )}
      
      {pathIds.map((fid, index) => {
        const fam = state.families[fid];
        if (!fam) return null;
        
        // Don't link if it's the very last element (current view)
        const isLast = index === pathIds.length - 1 && familyMatch;

        return (
          <React.Fragment key={fid}>
            <ChevronRight size={14} className="breadcrumb-separator" />
            {isLast ? (
              <span className="breadcrumb-link" style={{color: 'var(--text-primary)'}}>{fam.displayName}</span>
            ) : (
              <Link to={`/family/${fid}`} className="breadcrumb-link">
                {fam.displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
