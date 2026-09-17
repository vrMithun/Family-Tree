import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { subscribeToProjects, subscribeToPeople, subscribeToProjectData, executeBatchWrite, collections } from '../firebase/db';
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

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Helper to get current data for an item
  const getOldData = (fullState, collectionName, id) => {
    switch (collectionName) {
      case collections.PEOPLE:
        return fullState.people[id];
      case collections.FAMILIES:
        return fullState.families[id];
      case collections.MEMBERSHIPS:
        return fullState.familyMemberships.find(m => m.id === id);
      case collections.PARENT_CHILD:
        return fullState.parentChild.find(pc => pc.id === id);
      case collections.SPOUSES:
        return fullState.spouses.find(s => s.id === id);
      default:
        return null;
    }
  };

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
      
      const { newActiveProjectId, ops } = await handleFirebaseAction(fullStateForAction, action);
      
      // Calculate inverse operations
      if (ops && ops.length > 0) {
        const inverseOps = [];
        // Process in reverse order for correct undo sequence
        for (let i = ops.length - 1; i >= 0; i--) {
          const op = ops[i];
          const oldData = getOldData(fullStateForAction, op.collection, op.id);
          
          if (op.type === 'set') {
            inverseOps.push({ type: 'delete', collection: op.collection, id: op.id });
          } else if (op.type === 'update') {
            if (oldData) {
              // Extract only the fields that are being updated
              const oldFields = {};
              Object.keys(op.data).forEach(key => {
                oldFields[key] = oldData[key] !== undefined ? oldData[key] : null;
              });
              inverseOps.push({ type: 'update', collection: op.collection, id: op.id, data: oldFields });
            }
          } else if (op.type === 'delete') {
            if (oldData) {
              inverseOps.push({ type: 'set', collection: op.collection, id: op.id, data: oldData });
            }
          }
        }
        
        undoStack.current.push({ ops, inverseOps });
        redoStack.current = [];
        setCanUndo(true);
        setCanRedo(false);
        
        await executeBatchWrite(ops);
      }
      
      // If the action was CREATE_PROJECT, it returns the new ID, so switch to it
      if (newActiveProjectId && action.type === 'CREATE_PROJECT') {
        setGlobalState(prev => ({ ...prev, activeProjectId: newActiveProjectId }));
      }
    } catch (error) {
      console.error("Error dispatching action to Firebase:", action.type, error);
    }
  };

  const stateForComponents = { 
    ...activeProjectData, 
    people: globalState.people || {},
    generations
  };

  const undo = async () => {
    if (undoStack.current.length === 0) return;
    const action = undoStack.current.pop();
    redoStack.current.push(action);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    await executeBatchWrite(action.inverseOps);
  };

  const redo = async () => {
    if (redoStack.current.length === 0) return;
    const action = redoStack.current.pop();
    undoStack.current.push(action);
    setCanRedo(redoStack.current.length > 0);
    setCanUndo(true);
    await executeBatchWrite(action.ops);
  };

  return (
    <FamilyContext.Provider value={{ state: stateForComponents, globalState, dispatch, undo, redo, canUndo, canRedo }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
