import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Search, FolderTree, Settings, Plus, ChevronDown } from 'lucide-react';
import { useFamily } from '../store/FamilyStore';
import './Sidebar.css';

export function Sidebar() {
  const { globalState, dispatch } = useFamily();
  const navigate = useNavigate();
  const [showProjects, setShowProjects] = useState(false);

  const activeProject = globalState.projects[globalState.activeProjectId];
  const allProjects = Object.values(globalState.projects);

  const handleCreateProject = () => {
    const name = window.prompt("Enter new family tree name:");
    if (name) {
      dispatch({ type: 'CREATE_PROJECT', payload: { name } });
      setShowProjects(false);
      navigate('/tree');
    }
  };

  const handleSwitchProject = (projectId) => {
    dispatch({ type: 'SWITCH_PROJECT', payload: { projectId } });
    setShowProjects(false);
    navigate('/tree');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ position: 'relative' }}>
        <div 
          className="sidebar-title flex items-center justify-between" 
          style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '16px' }}
          onClick={() => setShowProjects(!showProjects)}
        >
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeProject ? activeProject.name : 'Family Tree'}
          </span>
          <ChevronDown size={16} />
        </div>

        {showProjects && (
          <div className="project-dropdown" style={{
            position: 'absolute', top: '100%', left: 0, right: 0, 
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', 
            borderRadius: '4px', marginTop: '4px', zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden'
          }}>
            {allProjects.map(proj => (
              <div 
                key={proj.id} 
                onClick={() => handleSwitchProject(proj.id)}
                style={{
                  padding: '10px 12px', cursor: 'pointer',
                  background: proj.id === globalState.activeProjectId ? 'var(--bg-active)' : 'transparent',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '14px'
                }}
              >
                {proj.name}
              </div>
            ))}
            <div 
              onClick={handleCreateProject}
              style={{
                padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                color: 'var(--accent-color)', fontSize: '14px', fontWeight: 500
              }}
            >
              <Plus size={14} />
              Create New Tree
            </div>
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive && window.location.pathname === '/' ? 'active' : ''}`} end>
          <Home size={18} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/tree" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FolderTree size={18} />
          <span>Family Tree</span>
        </NavLink>
        
        <NavLink to="/members" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Members</span>
        </NavLink>
        
        <NavLink to="/members?focusSearch=true" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={18} />
          <span>Search</span>
        </NavLink>
        

        <NavLink to="/settings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
