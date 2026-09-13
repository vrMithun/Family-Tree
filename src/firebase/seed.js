import { v4 as uuidv4 } from 'uuid';
import { executeBatchWrite, collections } from './db';
import { initialData } from '../data/mockData';

export const seedDatabase = async () => {
  const ops = [];

  // Seed People
  Object.values(initialData.people).forEach(person => {
    ops.push({ type: 'set', collection: collections.PEOPLE, id: person.id, data: person });
  });

  // Seed Projects & Project Data
  Object.values(initialData.projects).forEach(project => {
    ops.push({ type: 'set', collection: collections.PROJECTS, id: project.id, data: { id: project.id, name: project.name } });

    const projectId = project.id;
    const pd = project.data;

    // Seed Families
    Object.values(pd.families || {}).forEach(family => {
      ops.push({ type: 'set', collection: collections.FAMILIES, id: family.id, data: { ...family, projectId } });
    });

    // Seed Memberships
    (pd.familyMemberships || []).forEach(membership => {
      const id = membership.id || `${membership.familyId}_${membership.personId}_${membership.role}`;
      ops.push({ type: 'set', collection: collections.MEMBERSHIPS, id, data: { ...membership, id, projectId } });
    });

    // Seed ParentChild
    (pd.parentChild || []).forEach(pc => {
      const id = pc.id || `${pc.parentFamilyId}_${pc.childId}`;
      ops.push({ type: 'set', collection: collections.PARENT_CHILD, id, data: { ...pc, id, projectId } });
    });

    // Seed Spouses
    (pd.spouses || []).forEach(spouse => {
      const id = spouse.id || `${spouse.personAId}_${spouse.personBId}`;
      ops.push({ type: 'set', collection: collections.SPOUSES, id, data: { ...spouse, id, projectId } });
    });
  });

  // Split ops into batches of 500 (Firestore limit)
  for (let i = 0; i < ops.length; i += 500) {
    const chunk = ops.slice(i, i + 500);
    await executeBatchWrite(chunk);
  }
};
