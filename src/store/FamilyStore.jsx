import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { initialData, emptyProjectTemplate } from '../data/mockData';
import { calculateGenerations } from '../utils/generationUtils';
import { v4 as uuidv4 } from 'uuid';

const FamilyContext = createContext(null);

const initialState = {
  ...initialData
};

function projectDataReducer(state, action) {
  // Save history for undo, unless it's an undo action
  const saveState = (newState) => {
    // Only keeping last 10 states for memory
    const history = [...(state.history || []), state].slice(-10);
    return { ...newState, history };
  };

  switch (action.type) {
    case 'INIT_GENERATIONS': {
      const generations = calculateGenerations(state);
      return { ...state, generations };
    }
    
    case 'ADD_ROOT': {
      const { person } = action.payload;
      const newPerson = { ...person, id: uuidv4() };
      const newFamily = { id: uuidv4(), displayName: newPerson.name }; 
      
      const newState = {
        ...state,
        people: { ...state.people, [newPerson.id]: newPerson },
        families: { ...state.families, [newFamily.id]: newFamily },
        familyMemberships: [
          ...(state.familyMemberships || []),
          { familyId: newFamily.id, personId: newPerson.id, role: 'parent' }
        ]
      };
      
      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }
    
    case 'ADD_CHILD': {
      const { parentFamilyId, person } = action.payload;
      const newPerson = { ...person, id: uuidv4() };
      const newFamily = { id: uuidv4(), displayName: newPerson.name }; 
      
      const newState = {
        ...state,
        people: { ...state.people, [newPerson.id]: newPerson },
        families: { ...state.families, [newFamily.id]: newFamily },
        familyMemberships: [
          ...(state.familyMemberships || []),
          { familyId: newFamily.id, personId: newPerson.id, role: 'parent' }
        ],
        parentChild: [
          ...(state.parentChild || []),
          { parentFamilyId, childId: newPerson.id }
        ]
      };
      
      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }
    
    case 'ADD_PARENT': {
      const { targetFamilyId, person } = action.payload;
      const newPerson = { ...person, id: uuidv4() };
      const newFamily = { id: uuidv4(), displayName: newPerson.name }; 
      
      const coreMembers = (state.familyMemberships || [])
        .filter(m => m.familyId === targetFamilyId && m.role === 'parent')
        .map(m => m.personId);
      const targetPersonId = coreMembers[0]; 

      const newState = {
        ...state,
        people: { ...state.people, [newPerson.id]: newPerson },
        families: { ...state.families, [newFamily.id]: newFamily },
        familyMemberships: [
          ...(state.familyMemberships || []),
          { familyId: newFamily.id, personId: newPerson.id, role: 'parent' }
        ],
        parentChild: [
          ...(state.parentChild || []),
          { parentFamilyId: newFamily.id, childId: targetPersonId }
        ]
      };
      
      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }

    case 'ADD_SIBLING': {
      const { siblingFamilyId, person } = action.payload;
      
      const coreMembers = (state.familyMemberships || [])
        .filter(m => m.familyId === siblingFamilyId && m.role === 'parent')
        .map(m => m.personId);
      const siblingPersonId = coreMembers[0];

      const parentRel = (state.parentChild || []).find(pc => pc.childId === siblingPersonId);
      
      let newState = { ...state };
      let actualParentFamilyId = parentRel ? parentRel.parentFamilyId : null;

      if (!actualParentFamilyId) {
        actualParentFamilyId = uuidv4();
        newState.families = {
          ...newState.families,
          [actualParentFamilyId]: { id: actualParentFamilyId, displayName: "Unknown Parents" }
        };
        newState.parentChild = [
          ...(newState.parentChild || []),
          { parentFamilyId: actualParentFamilyId, childId: siblingPersonId }
        ];
      }

      const newPerson = { ...person, id: uuidv4() };
      const newFamily = { id: uuidv4(), displayName: newPerson.name };

      newState.people = { ...newState.people, [newPerson.id]: newPerson };
      newState.families = { ...newState.families, [newFamily.id]: newFamily };
      newState.familyMemberships = [
        ...(newState.familyMemberships || []),
        { familyId: newFamily.id, personId: newPerson.id, role: 'parent' }
      ];
      newState.parentChild = [
        ...(newState.parentChild || []),
        { parentFamilyId: actualParentFamilyId, childId: newPerson.id }
      ];

      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }
    
    case 'ADD_SPOUSE': {
      const { personAId, personBId, newPerson } = action.payload;
      let newState = { ...state };
      let spouseId = personBId;
      
      if (newPerson) {
        spouseId = uuidv4();
        const p = { ...newPerson, id: spouseId };
        newState.people = { ...newState.people, [spouseId]: p };
      }
      
      newState.spouses = [...(newState.spouses || []), { personAId, personBId: spouseId }];
      
      const famId = (newState.familyMemberships || []).find(m => m.personId === personAId && m.role === 'parent')?.familyId;
      if (famId) {
        newState.familyMemberships = [
          ...newState.familyMemberships,
          { familyId: famId, personId: spouseId, role: 'parent' }
        ];
        
        const pA = newState.people[personAId];
        const pB = newState.people[spouseId];
        const firstNameA = pA.name.split(' ')[0];
        const firstNameB = pB.name.split(' ')[0];
        newState.families = {
          ...newState.families,
          [famId]: { ...newState.families[famId], displayName: `${firstNameA} & ${firstNameB}` }
        };
      }
      
      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }
    
    case 'EDIT_PERSON': {
      const { id, updates } = action.payload;
      const newState = {
        ...state,
        people: {
          ...state.people,
          [id]: { ...state.people[id], ...updates }
        }
      };
      return saveState(newState);
    }
    
    case 'DELETE_PERSON': {
      const { id } = action.payload;
      const newState = { ...state };
      
      // Remove from people
      const newPeople = { ...newState.people };
      delete newPeople[id];
      newState.people = newPeople;
      
      // Remove from memberships
      newState.familyMemberships = (newState.familyMemberships || []).filter(m => m.personId !== id);
      
      // Remove from spouses
      newState.spouses = (newState.spouses || []).filter(s => s.personAId !== id && s.personBId !== id);
      
      // Remove from parentChild
      newState.parentChild = (newState.parentChild || []).filter(pc => pc.childId !== id);

      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }

    case 'EDIT_FAMILY': {
      const { id, updates } = action.payload;
      const newState = {
        ...state,
        families: {
          ...state.families,
          [id]: { ...state.families[id], ...updates }
        }
      };
      return saveState(newState);
    }
    
    case 'MOVE_SUBTREE': {
      const { targetFamilyId, newParentFamilyId } = action.payload;
      
      let childIdToMove = null;
      let existingPcIndex = -1;
      
      const coreMembers = (state.familyMemberships || [])
        .filter(m => m.familyId === targetFamilyId && m.role === 'parent')
        .map(m => m.personId);
        
      for (let i = 0; i < (state.parentChild || []).length; i++) {
        if (coreMembers.includes(state.parentChild[i].childId)) {
          childIdToMove = state.parentChild[i].childId;
          existingPcIndex = i;
          break;
        }
      }
      
      const newState = { ...state };
      
      if (existingPcIndex > -1) {
        const newPc = [...state.parentChild];
        newPc[existingPcIndex] = { ...newPc[existingPcIndex], parentFamilyId: newParentFamilyId };
        newState.parentChild = newPc;
      } else if (coreMembers.length > 0) {
        newState.parentChild = [
          ...(state.parentChild || []),
          { parentFamilyId: newParentFamilyId, childId: coreMembers[0] }
        ];
      }
      
      newState.generations = calculateGenerations(newState);
      return saveState(newState);
    }
    
    case 'UNDO': {
      if (!state.history || state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      return previousState;
    }

    default:
      return state;
  }
}

function rootReducer(state, action) {
  if (action.type === 'CREATE_PROJECT') {
    const { name } = action.payload;
    const newProjectId = `proj-${uuidv4()}`;
    return {
      ...state,
      activeProjectId: newProjectId,
      projects: {
        ...state.projects,
        [newProjectId]: {
          id: newProjectId,
          name,
          data: { ...emptyProjectTemplate, generations: { familyGens: {}, personGens: {} } },
          history: []
        }
      }
    };
  }

  if (action.type === 'SWITCH_PROJECT') {
    return {
      ...state,
      activeProjectId: action.payload.projectId
    };
  }

  // Route all other actions to the active project
  if (state.activeProjectId && state.projects[state.activeProjectId]) {
    const activeProject = state.projects[state.activeProjectId];
    const newProjectData = projectDataReducer(activeProject.data, action);
    
    return {
      ...state,
      projects: {
        ...state.projects,
        [state.activeProjectId]: {
          ...activeProject,
          data: newProjectData
        }
      }
    };
  }

  return state;
}

export function FamilyProvider({ children }) {
  const [globalState, dispatch] = useReducer(rootReducer, initialState);

  // Initialize generations on mount
  useEffect(() => {
    dispatch({ type: 'INIT_GENERATIONS' });
  }, []);

  // Expose the active project data as `state` to maintain backward compatibility with components
  const activeProjectData = globalState.activeProjectId ? globalState.projects[globalState.activeProjectId].data : null;

  return (
    <FamilyContext.Provider value={{ state: activeProjectData, globalState, dispatch }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
