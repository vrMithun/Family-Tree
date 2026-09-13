import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Users, Plus, Calendar, Trash2 } from 'lucide-react';
import { useFamily } from '../store/FamilyStore';
import { seedDatabase } from '../firebase/seed';
import './ProjectDashboard.css';

export function ProjectDashboard() {
  const { globalState, dispatch } = useFamily();
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);

  const allProjects = Object.values(globalState.projects);

  const handleSelectProject = (projectId) => {
    dispatch({ type: 'SWITCH_PROJECT', payload: { projectId } });
    navigate('/tree');
  };

  const handleCreateProject = () => {
    const name = window.prompt("Enter new family tree name:");
    if (name) {
      dispatch({ type: 'CREATE_PROJECT', payload: { name } });
      // Wait for state to update, or assume the active project changes in reducer
      setTimeout(() => navigate('/tree'), 50);
    }
  };

  const handleSeed = async () => {
    if (window.confirm("This will write the mock data to your Firebase database. Continue?")) {
      setIsSeeding(true);
      try {
        await seedDatabase();
        alert("Database seeded successfully!");
      } catch (e) {
        console.error(e);
        alert("Error seeding database");
      }
      setIsSeeding(false);
    }
  };

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Projects Dashboard</h1>
        <p className="dashboard-subtitle">Select a family tree to start editing, or create a new one.</p>
        <button 
          className="btn" 
          onClick={handleSeed}
          disabled={isSeeding}
          style={{ marginTop: '16px' }}
        >
          {isSeeding ? 'Seeding...' : 'Seed Mock Data to Firebase'}
        </button>
      </div>

      <div className="projects-grid">
        {allProjects.map(project => {
          const isActive = project.id === globalState.activeProjectId;
          
          return (
            <div 
              key={project.id} 
              className={`project-card ${isActive ? 'active-project' : ''}`}
              onClick={() => handleSelectProject(project.id)}
            >
              {isActive && <span className="active-badge">Active</span>}
              
              <div className="project-icon">
                <FolderTree size={24} />
              </div>
              
              <div className="project-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{project.name}</h3>
                <button 
                  className="btn-icon" 
                  title="Delete Project"
                  style={{ color: '#d13438', padding: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
                      dispatch({ type: 'DELETE_PROJECT', payload: { projectId: project.id } });
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        <div className="project-card create-project-card" onClick={handleCreateProject}>
          <div className="project-icon">
            <Plus size={24} />
          </div>
          <div className="project-info">
            <h3 style={{ color: 'var(--text-secondary)' }}>Create New Tree</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
