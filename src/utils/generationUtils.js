/**
 * Calculates generations for all families and people relative to all root families.
 * Generates a map of familyId -> generation and personId -> generation.
 */
export function calculateGenerations(data) {
  const familyGens = {};
  const personGens = {};
  
  const allFamilies = Object.keys(data.families);
  if (allFamilies.length === 0) return { familyGens, personGens };

  const childIds = new Set(data.parentChild.map(pc => pc.childId));
  
  const rootFamilies = allFamilies.filter(familyId => {
    const members = data.familyMemberships
      .filter(m => m.familyId === familyId && m.role === 'parent')
      .map(m => m.personId);
    
    // A family is a root if none of its members are a child in another family
    return !members.some(memberId => childIds.has(memberId));
  });

  // Queue for BFS traversal
  // elements are { familyId, generation }
  const queue = rootFamilies.map(familyId => ({ familyId, generation: 1 }));
  
  // We need a quick way to find child families
  // A child family is a family where one of its members is a child of the current family.
  // Actually, parentChild relationship maps parentFamilyId -> childId.
  // Then we find which families the child is a parent/core member of.
  
  const childIdToFamilyIds = {};
  data.familyMemberships.forEach(membership => {
    if (membership.role === 'parent') {
      if (!childIdToFamilyIds[membership.personId]) {
        childIdToFamilyIds[membership.personId] = [];
      }
      childIdToFamilyIds[membership.personId].push(membership.familyId);
    }
  });

  const parentFamilyToChildIds = {};
  data.parentChild.forEach(pc => {
    if (!parentFamilyToChildIds[pc.parentFamilyId]) {
      parentFamilyToChildIds[pc.parentFamilyId] = [];
    }
    parentFamilyToChildIds[pc.parentFamilyId].push(pc.childId);
  });

  while (queue.length > 0) {
    const { familyId, generation } = queue.shift();
    
    // If we've already visited this family at a lower generation, skip to avoid cycles
    // (though there shouldn't be cycles in a strict tree, it's safe)
    if (familyGens[familyId] && familyGens[familyId] <= generation) {
      continue;
    }
    
    familyGens[familyId] = generation;
    
    // Assign generation to the members of this family
    const members = data.familyMemberships
      .filter(m => m.familyId === familyId && m.role === 'parent')
      .map(m => m.personId);
      
    members.forEach(memberId => {
      // If a person is reached, set their generation
      // If they were already reached, we might keep the lowest generation
      if (!personGens[memberId] || personGens[memberId] > generation) {
        personGens[memberId] = generation;
      }
    });

    // Traverse to children
    const childIds = parentFamilyToChildIds[familyId] || [];
    childIds.forEach(childId => {
      // Children belong to the next generation
      if (!personGens[childId] || personGens[childId] > generation + 1) {
        personGens[childId] = generation + 1;
      }
      
      // If this child has their own families, queue them
      const childFamilies = childIdToFamilyIds[childId] || [];
      childFamilies.forEach(cfId => {
        queue.push({ familyId: cfId, generation: generation + 1 });
      });
    });
  }

  return { familyGens, personGens };
}
