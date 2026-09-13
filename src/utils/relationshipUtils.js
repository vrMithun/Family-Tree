export function getFamilyMembers(data, familyId) {
  const memberships = data.familyMemberships.filter(m => m.familyId === familyId && m.role === 'parent');
  // Deduplicate by personId to prevent showing same person twice
  const seen = new Set();
  const uniqueMemberships = memberships.filter(m => {
    if (seen.has(m.personId)) return false;
    seen.add(m.personId);
    return true;
  });
  return uniqueMemberships.map(m => data.people[m.personId]).filter(Boolean);
}

export function getFamilyChildrenIds(data, familyId) {
  return data.parentChild
    .filter(pc => pc.parentFamilyId === familyId)
    .map(pc => pc.childId);
}

export function getFamilyChildren(data, familyId) {
  const childIds = getFamilyChildrenIds(data, familyId);
  return childIds.map(id => data.people[id]).filter(Boolean);
}

// Find families where this person is a child
export function getParentFamilies(data, personId) {
  const pcRels = data.parentChild.filter(pc => pc.childId === personId);
  return pcRels.map(pc => pc.parentFamilyId);
}

// Find families where this person is a core member (parent/spouse)
export function getFamiliesForPerson(data, personId) {
  const memberships = data.familyMemberships.filter(m => m.personId === personId && m.role === 'parent');
  return memberships.map(m => m.familyId);
}
