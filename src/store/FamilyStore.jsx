import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToProjects, subscribeToPeople, subscribeToProjectData } from '../firebase/db';
import { handleFirebaseAction } from './firebaseActions';
import { calculateGenerations } from '../utils/generationUtils';

const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const [globalState, setGlobalState] = useState({
    activeProjectId: null,
    projects: {},
    people: {}
  });

  const [activeProjectData, setActiveProjectData] = useState({
    families: {},
    familyMemberships: [],
    parentChild: [],
    spouses: []
  });

  const [generations, setGenerations] = useState({ familyGens: {}, personGens: {} });

  // 1. Subscribe to Projects
  useEffect(() => {
    const unsubscribe = subscribeToProjects((projects) => {
      setGlobalState(prev => {
        const newState = { ...prev, projects };
        // If active project was deleted, clear activeProjectId
        if (prev.activeProjectId && !projects[prev.activeProjectId]) {
          newState.activeProjectId = null;
        }
        // If no active project, and there are projects, pick first
        if (!newState.activeProjectId && Object.keys(projects).length > 0) {
          newState.activeProjectId = Object.keys(projects)[0];
        }
        return newState;
      });
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to People
  useEffect(() => {
    const unsubscribe = subscribeToPeople((people) => {
      setGlobalState(prev => ({ ...prev, people }));
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Active Project Data
  useEffect(() => {
    if (globalState.activeProjectId) {
      const unsubscribe = subscribeToProjectData(globalState.activeProjectId, (data) => {
        setActiveProjectData(data);
      });
      return () => unsubscribe();
    } else {
      setActiveProjectData({ families: {}, familyMemberships: [], parentChild: [], spouses: [] });
    }
  }, [globalState.activeProjectId]);

  // 4. Calculate Generations whenever people or structural data changes
  useEffect(() => {
    if (!globalState.activeProjectId) return;
    const combinedState = { ...activeProjectData, people: globalState.people };
    const gens = calculateGenerations(combinedState);
    setGenerations(gens);
  }, [activeProjectData, globalState.people, globalState.activeProjectId]);

  const dispatch = async (action) => {
    try {
      if (action.type === 'SWITCH_PROJECT') {
        setGlobalState(prev => ({ ...prev, activeProjectId: action.payload.projectId }));
        return;
      }
      
      const fullStateForAction = { 
        ...globalState, 
        ...activeProjectData 
      };
      
      const newActiveProjectId = await handleFirebaseAction(fullStateForAction, action);
      
      // If the action was CREATE_PROJECT, it returns the new ID, so switch to it
      if (newActiveProjectId && action.type === 'CREATE_PROJECT') {
        setGlobalState(prev => ({ ...prev, activeProjectId: newActiveProjectId }));
      }
    } catch (error) {
      console.error("Error dispatching action to Firebase:", error);
    }
  };

  const stateForComponents = { 
    ...activeProjectData, 
    people: globalState.people || {},
    generations
  };

  return (
    <FamilyContext.Provider value={{ state: stateForComponents, globalState, dispatch }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
