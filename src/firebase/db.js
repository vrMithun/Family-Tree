import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

export const collections = {
  PROJECTS: 'projects',
  PEOPLE: 'people',
  FAMILIES: 'families',
  MEMBERSHIPS: 'memberships',
  PARENT_CHILD: 'parentChild',
  SPOUSES: 'spouses'
};

// -- Projects --
export const createProject = async (project) => {
  if (!db) return;
  await setDoc(doc(db, collections.PROJECTS, project.id), project);
};

export const deleteProject = async (projectId) => {
  if (!db) return;
  const batch = writeBatch(db);
  batch.delete(doc(db, collections.PROJECTS, projectId));
  // Additional cleanup for families/memberships can be done here or via Cloud Functions
  await batch.commit();
};

export const subscribeToProjects = (callback) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, collections.PROJECTS), (snapshot) => {
    const projects = {};
    snapshot.forEach(doc => {
      projects[doc.id] = doc.data();
    });
    callback(projects);
  });
};

// -- People (Global Members Database) --
export const savePerson = async (person) => {
  if (!db) return;
  await setDoc(doc(db, collections.PEOPLE, person.id), person);
};

export const updatePerson = async (personId, updates) => {
  if (!db) return;
  await updateDoc(doc(db, collections.PEOPLE, personId), updates);
};

export const deletePerson = async (personId) => {
  if (!db) return;
  // This should actually set isProxy=true instead of hard deleting
  // if they have children, but that logic can stay in the store
  await deleteDoc(doc(db, collections.PEOPLE, personId));
};

export const subscribeToPeople = (callback) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, collections.PEOPLE), (snapshot) => {
    const people = {};
    snapshot.forEach(doc => {
      people[doc.id] = doc.data();
    });
    callback(people);
  });
};

// -- Structural Project Data (Families, Memberships) --
export const subscribeToProjectData = (projectId, callback) => {
  if (!db || !projectId) return () => {};
  
  let data = {
    families: {},
    familyMemberships: [],
    parentChild: [],
    spouses: []
  };

  const notify = () => callback({ ...data });

  const unsubFamilies = onSnapshot(
    query(collection(db, collections.FAMILIES), where('projectId', '==', projectId)),
    (snapshot) => {
      data.families = {};
      snapshot.forEach(doc => { data.families[doc.id] = doc.data(); });
      notify();
    }
  );

  const unsubMemberships = onSnapshot(
    query(collection(db, collections.MEMBERSHIPS), where('projectId', '==', projectId)),
    (snapshot) => {
      data.familyMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notify();
    }
  );

  const unsubParentChild = onSnapshot(
    query(collection(db, collections.PARENT_CHILD), where('projectId', '==', projectId)),
    (snapshot) => {
      data.parentChild = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notify();
    }
  );

  const unsubSpouses = onSnapshot(
    query(collection(db, collections.SPOUSES), where('projectId', '==', projectId)),
    (snapshot) => {
      data.spouses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notify();
    }
  );

  return () => {
    unsubFamilies();
    unsubMemberships();
    unsubParentChild();
    unsubSpouses();
  };
};

// A helper for batch structural writes
export const executeBatchWrite = async (operations) => {
  if (!db) return;
  const batch = writeBatch(db);
  
  operations.forEach(op => {
    const ref = doc(db, op.collection, op.id);
    if (op.type === 'set') batch.set(ref, op.data);
    if (op.type === 'update') batch.update(ref, op.data);
    if (op.type === 'delete') batch.delete(ref);
  });
  
  await batch.commit();
};
