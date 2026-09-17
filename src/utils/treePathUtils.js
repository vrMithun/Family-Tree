import { getFamilyChildrenIds, getFamiliesForPerson } from './relationshipUtils';

/**
 * Builds a hierarchical tree of family nodes starting from a root family.
 * The node represents a Family. If a child has their own families, those are nested under the child.
 * But since we display a File Explorer of *Families*, the hierarchy is:
 * Family -> Children -> Child's Families
 */
export function buildFamilyForest(data, generations, specificRootFamilyId = null) {
  console.log("buildFamilyForest called with:", { data, generations, specificRootFamilyId });
  const visited = new Set();
  
  function buildNode(familyId, bioChildId = null) {
    if (visited.has(familyId)) {
      return null;
    }
    visited.add(familyId);
    
    const family = data.families[familyId];
    if (!family) return null;

    const childIds = getFamilyChildrenIds(data, familyId);
    
    // Sort children by their order field from parentChild records
    const childPcRecords = (data.parentChild || []).filter(pc => pc.parentFamilyId === familyId);
    const sortedChildIds = [...childIds].sort((a, b) => {
      const aRecord = childPcRecords.find(pc => pc.childId === a);
      const bRecord = childPcRecords.find(pc => pc.childId === b);
      return (aRecord?.order ?? 0) - (bRecord?.order ?? 0);
    });
    
    const childFamilyNodes = [];
    
    sortedChildIds.forEach(childId => {
      const familiesAsParent = getFamiliesForPerson(data, childId);
      familiesAsParent.forEach(cfId => {
        const childNode = buildNode(cfId, childId);
        if (childNode) {
          childFamilyNodes.push(childNode);
        }
      });
    });

    const bioPerson = bioChildId ? data.people[bioChildId] : null;

    return {
      familyId,
      family,
      generation: generations?.familyGens?.[familyId],
      childrenNodes: childFamilyNodes,
      bioChildName: bioPerson ? bioPerson.name : null
    };
  }

  const forest = [];

  if (specificRootFamilyId) {
    const node = buildNode(specificRootFamilyId);
    if (node) forest.push(node);
    return forest;
  }

  // Find all root families
  const allFamilies = Object.keys(data.families);
  const childIds = new Set(data.parentChild.map(pc => pc.childId));
  
  const rootFamilies = allFamilies.filter(familyId => {
    const members = data.familyMemberships
      .filter(m => m.familyId === familyId && m.role === 'parent')
      .map(m => m.personId);
    return !members.some(memberId => childIds.has(memberId));
  });

  rootFamilies.forEach(rootId => {
    const node = buildNode(rootId);
    if (node) forest.push(node);
  });
  
  return forest;
}

/**
 * Get all descendant family IDs for a given family.
 * Useful for validating moves or archiving.
 */
export function getDescendantFamilyIds(data, startFamilyId) {
  const descendants = new Set();
  const queue = [startFamilyId];
  
  while(queue.length > 0) {
    const curr = queue.shift();
    descendants.add(curr);
    
    const childIds = getFamilyChildrenIds(data, curr);
    childIds.forEach(childId => {
      const fams = getFamiliesForPerson(data, childId);
      fams.forEach(f => {
        if (!descendants.has(f)) {
          queue.push(f);
        }
      });
    });
  }
  
  return Array.from(descendants);
}

export function getPathToRoot(data, familyId) {
  const path = [];
  let curr = familyId;
  
  // To avoid infinite loops in bad data
  const visited = new Set();
  
  while (curr && !visited.has(curr)) {
    visited.add(curr);
    path.unshift(curr);
    
    // Find who is the biological child in this family
    const members = data.familyMemberships
      .filter(m => m.familyId === curr && m.role === 'parent')
      .map(m => m.personId);
      
    // Find parentChild link where the child is one of these members
    const pc = data.parentChild.find(p => members.includes(p.childId));
    curr = pc ? pc.parentFamilyId : null;
  }
  return path;
}

