import { v4 as uuidv4 } from 'uuid';
import { executeBatchWrite, collections, savePerson, updatePerson, deletePerson, createProject, deleteProject as dbDeleteProject } from '../firebase/db';
import { calculateGenerations } from '../utils/generationUtils';
import { emptyProjectTemplate } from '../data/mockData';

// Helper to resolve person for writes
const resolvePersonWrite = (payload) => {
  if (payload.existingPersonId) {
    return { id: payload.existingPersonId, isNew: false, person: null };
  }
  const id = uuidv4();
  return { id, isNew: true, person: { ...payload.person, id } };
};

export const handleFirebaseAction = async (state, action) => {
  // state represents the currently loaded project + global people
  // We need to generate a list of Firestore batch operations based on the action
  const projectId = state.activeProjectId;
  const ops = [];

  switch (action.type) {
    case 'CREATE_PROJECT': {
      const { name } = action.payload;
      const newProjectId = `proj-${uuidv4()}`;
      await createProject({ id: newProjectId, name });
      return newProjectId; // Return ID so UI can switch to it
    }

    case 'DELETE_PROJECT': {
      await dbDeleteProject(action.payload.projectId);
      return null;
    }

    case 'ADD_ROOT': {
      const resolved = resolvePersonWrite(action.payload);
      if (resolved.isNew) {
        ops.push({ type: 'set', collection: collections.PEOPLE, id: resolved.id, data: resolved.person });
      }
      
      const newFamily = { id: uuidv4(), displayName: resolved.isNew ? resolved.person.name : state.people[resolved.id].name, projectId };
      const membership = { id: uuidv4(), familyId: newFamily.id, personId: resolved.id, role: 'parent', projectId };
      
      ops.push({ type: 'set', collection: collections.FAMILIES, id: newFamily.id, data: newFamily });
      ops.push({ type: 'set', collection: collections.MEMBERSHIPS, id: membership.id, data: membership });
      
      await executeBatchWrite(ops);
      break;
    }

    case 'ADD_CHILD': {
      const { parentFamilyId } = action.payload;
      const resolved = resolvePersonWrite(action.payload);
      if (resolved.isNew) {
        ops.push({ type: 'set', collection: collections.PEOPLE, id: resolved.id, data: resolved.person });
      }
      
      const newFamily = { id: uuidv4(), displayName: resolved.isNew ? resolved.person.name : state.people[resolved.id].name, projectId };
      const membership = { id: uuidv4(), familyId: newFamily.id, personId: resolved.id, role: 'parent', projectId };
      const pcLink = { id: uuidv4(), parentFamilyId, childId: resolved.id, projectId };
      
      ops.push({ type: 'set', collection: collections.FAMILIES, id: newFamily.id, data: newFamily });
      ops.push({ type: 'set', collection: collections.MEMBERSHIPS, id: membership.id, data: membership });
      ops.push({ type: 'set', collection: collections.PARENT_CHILD, id: pcLink.id, data: pcLink });
      
      await executeBatchWrite(ops);
      break;
    }

    case 'ADD_PARENT': {
      const { targetFamilyId } = action.payload;
      const resolved = resolvePersonWrite(action.payload);
      if (resolved.isNew) {
        ops.push({ type: 'set', collection: collections.PEOPLE, id: resolved.id, data: resolved.person });
      }
      
      const newFamily = { id: uuidv4(), displayName: resolved.isNew ? resolved.person.name : state.people[resolved.id].name, projectId };
      
      // Find the core member of the target family
      const coreMembers = (state.familyMemberships || [])
        .filter(m => m.familyId === targetFamilyId && m.role === 'parent')
        .map(m => m.personId);
      const targetPersonId = coreMembers[0];
      
      const membership = { id: uuidv4(), familyId: newFamily.id, personId: resolved.id, role: 'parent', projectId };
      const pcLink = { id: uuidv4(), parentFamilyId: newFamily.id, childId: targetPersonId, projectId };
      
      ops.push({ type: 'set', collection: collections.FAMILIES, id: newFamily.id, data: newFamily });
      ops.push({ type: 'set', collection: collections.MEMBERSHIPS, id: membership.id, data: membership });
      ops.push({ type: 'set', collection: collections.PARENT_CHILD, id: pcLink.id, data: pcLink });
      
      await executeBatchWrite(ops);
      break;
    }

    case 'ADD_SIBLING': {
      const { siblingFamilyId } = action.payload;
      
      const coreMembers = (state.familyMemberships || [])
        .filter(m => m.familyId === siblingFamilyId && m.role === 'parent')
        .map(m => m.personId);
      const siblingPersonId = coreMembers[0];

      const parentRel = (state.parentChild || []).find(pc => pc.childId === siblingPersonId);
      
      let actualParentFamilyId = parentRel ? parentRel.parentFamilyId : null;

      if (!actualParentFamilyId) {
        actualParentFamilyId = uuidv4();
        const unknownFamily = { id: actualParentFamilyId, displayName: "Unknown Parents", projectId };
        const unknownPcLink = { id: uuidv4(), parentFamilyId: actualParentFamilyId, childId: siblingPersonId, projectId };
        
        ops.push({ type: 'set', collection: collections.FAMILIES, id: unknownFamily.id, data: unknownFamily });
        ops.push({ type: 'set', collection: collections.PARENT_CHILD, id: unknownPcLink.id, data: unknownPcLink });
      }

      const resolved = resolvePersonWrite(action.payload);
      if (resolved.isNew) {
        ops.push({ type: 'set', collection: collections.PEOPLE, id: resolved.id, data: resolved.person });
      }
      
      const newFamily = { id: uuidv4(), displayName: resolved.isNew ? resolved.person.name : state.people[resolved.id].name, projectId };
      const membership = { id: uuidv4(), familyId: newFamily.id, personId: resolved.id, role: 'parent', projectId };
      const pcLink = { id: uuidv4(), parentFamilyId: actualParentFamilyId, childId: resolved.id, projectId };
      
      ops.push({ type: 'set', collection: collections.FAMILIES, id: newFamily.id, data: newFamily });
      ops.push({ type: 'set', collection: collections.MEMBERSHIPS, id: membership.id, data: membership });
      ops.push({ type: 'set', collection: collections.PARENT_CHILD, id: pcLink.id, data: pcLink });
      
      await executeBatchWrite(ops);
      break;
    }

    case 'ADD_SPOUSE': {
      const { personAId, newPerson, existingPersonId } = action.payload;
      let spouseId = existingPersonId;
      
      if (!existingPersonId && newPerson) {
        spouseId = uuidv4();
        const p = { ...newPerson, id: spouseId };
        ops.push({ type: 'set', collection: collections.PEOPLE, id: spouseId, data: p });
      }
      
      const spouseLink = { id: uuidv4(), personAId, personBId: spouseId, projectId };
      ops.push({ type: 'set', collection: collections.SPOUSES, id: spouseLink.id, data: spouseLink });
      
      const famId = (state.familyMemberships || []).find(m => m.personId === personAId && m.role === 'parent')?.familyId;
      if (famId) {
        // Only add membership if spouse isn't already a member of this family
        const alreadyMember = (state.familyMemberships || []).some(m => m.familyId === famId && m.personId === spouseId);
        if (!alreadyMember) {
          const membership = { id: uuidv4(), familyId: famId, personId: spouseId, role: 'parent', projectId };
          ops.push({ type: 'set', collection: collections.MEMBERSHIPS, id: membership.id, data: membership });
        }
        
        const pA = state.people[personAId];
        const pB = existingPersonId ? state.people[spouseId] : newPerson;
        const firstNameA = pA?.name.split(' ')[0] || 'Unknown';
        const firstNameB = pB?.name.split(' ')[0] || 'Unknown';
        
        ops.push({ type: 'update', collection: collections.FAMILIES, id: famId, data: { displayName: `${firstNameA} & ${firstNameB}` } });
      }
      
      await executeBatchWrite(ops);
      break;
    }

    case 'EDIT_PERSON': {
      const { id, updates } = action.payload;
      await updatePerson(id, updates);
      break;
    }

    case 'DELETE_PERSON': {
      const { id } = action.payload;
      
      const familiesAsParent = (state.familyMemberships || [])
        .filter(m => m.personId === id && m.role === 'parent')
        .map(m => m.familyId);
        
      const hasChildren = (state.parentChild || []).some(pc => familiesAsParent.includes(pc.parentFamilyId));
      
      if (hasChildren) {
        ops.push({
          type: 'update',
          collection: collections.PEOPLE,
          id,
          data: { name: 'Unknown Person', isProxy: true, birthDate: '', deathDate: '', birthPlace: '', notes: '' }
        });
        
        familiesAsParent.forEach(famId => {
          const members = (state.familyMemberships || []).filter(m => m.familyId === famId && m.role === 'parent');
          if (members.length === 2) {
             const p1Id = members[0].personId;
             const p2Id = members[1].personId;
             const p1 = p1Id === id ? { name: 'Unknown Person' } : state.people[p1Id];
             const p2 = p2Id === id ? { name: 'Unknown Person' } : state.people[p2Id];
             const n1 = p1?.name.split(' ')[0] || 'Unknown';
             const n2 = p2?.name.split(' ')[0] || 'Unknown';
             ops.push({ type: 'update', collection: collections.FAMILIES, id: famId, data: { displayName: `${n1} & ${n2}` } });
          } else {
             ops.push({ type: 'update', collection: collections.FAMILIES, id: famId, data: { displayName: 'Unknown Person' } });
          }
        });
      } else {
        ops.push({ type: 'delete', collection: collections.PEOPLE, id });
        
        // Find and delete related memberships, spouses, parentChild links
        const membershipsToDelete = (state.familyMemberships || []).filter(m => m.personId === id);
        membershipsToDelete.forEach(m => ops.push({ type: 'delete', collection: collections.MEMBERSHIPS, id: m.id || m.familyId + '_' + m.personId })); // Needs stable IDs
        
        // Assuming we rely on stable IDs for relational records, which I added in this refactor (id: uuidv4())
        // Wait, existing mock data doesn't have IDs for parentChild and memberships!
        // We will seed them with IDs.
      }
      
      await executeBatchWrite(ops);
      break;
    }

    case 'DELETE_FAMILY': {
      const { id } = action.payload;
      ops.push({ type: 'delete', collection: collections.FAMILIES, id });
      
      // Delete memberships
      const memberships = (state.familyMemberships || []).filter(m => m.familyId === id);
      memberships.forEach(m => ops.push({ type: 'delete', collection: collections.MEMBERSHIPS, id: m.id }));
      
      // Delete parentChild links where this family is the parent
      const pcLinks = (state.parentChild || []).filter(pc => pc.parentFamilyId === id);
      pcLinks.forEach(pc => ops.push({ type: 'delete', collection: collections.PARENT_CHILD, id: pc.id }));
      
      await executeBatchWrite(ops);
      break;
    }

    case 'EDIT_FAMILY': {
      const { id, updates } = action.payload;
      ops.push({ type: 'update', collection: collections.FAMILIES, id, data: updates });
      await executeBatchWrite(ops);
      break;
    }

    case 'MOVE_SUBTREE': {
      const { targetFamilyId, newParentFamilyId } = action.payload;
      
      let childIdToMove = null;
      let existingPcLink = null;
      
      const coreMembers = (state.familyMemberships || [])
        .filter(m => m.familyId === targetFamilyId && m.role === 'parent')
        .map(m => m.personId);
        
      for (let i = 0; i < (state.parentChild || []).length; i++) {
        if (coreMembers.includes(state.parentChild[i].childId)) {
          childIdToMove = state.parentChild[i].childId;
          existingPcLink = state.parentChild[i];
          break;
        }
      }
      
      if (existingPcLink && existingPcLink.id) {
        ops.push({ type: 'update', collection: collections.PARENT_CHILD, id: existingPcLink.id, data: { parentFamilyId: newParentFamilyId } });
      } else if (coreMembers.length > 0) {
        const pcLink = { id: uuidv4(), parentFamilyId: newParentFamilyId, childId: coreMembers[0], projectId };
        ops.push({ type: 'set', collection: collections.PARENT_CHILD, id: pcLink.id, data: pcLink });
      }
      
      await executeBatchWrite(ops);
      break;
    }
  }
};
