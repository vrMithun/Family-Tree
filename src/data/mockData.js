export const emptyProjectTemplate = {
  families: {},
  familyMemberships: [],
  parentChild: [],
  spouses: []
};

const defaultPeople = {
  "p-ramasamy": { id: "p-ramasamy", name: "Ramasamy", birthDate: "1940", deathDate: "2020", gender: "M" },
  "p-lakshmi": { id: "p-lakshmi", name: "Lakshmi", birthDate: "1945", deathDate: "2022", gender: "F" },
  
  "p-suresh": { id: "p-suresh", name: "Suresh Kumar", birthDate: "1965", deathDate: "", gender: "M" },
  "p-meena": { id: "p-meena", name: "Meena", birthDate: "1968", deathDate: "", gender: "F" },
  
  "p-ramesh": { id: "p-ramesh", name: "Ramesh", birthDate: "1967", deathDate: "", gender: "M" },
  "p-kala": { id: "p-kala", name: "Kala", birthDate: "1970", deathDate: "", gender: "F" },

  "p-kumar": { id: "p-kumar", name: "Kumar", birthDate: "1972", deathDate: "", gender: "M" },
  "p-devi": { id: "p-devi", name: "Devi", birthDate: "1975", deathDate: "", gender: "F" },
  
  "p-arun": { id: "p-arun", name: "Arun Kumar", birthDate: "1990", deathDate: "", gender: "M" },
  "p-priya": { id: "p-priya", name: "Priya", birthDate: "1992", deathDate: "", gender: "F" },
  
  "p-ravi": { id: "p-ravi", name: "Ravi", birthDate: "1995", deathDate: "", gender: "M" },
  
  "p-karthik": { id: "p-karthik", name: "Karthik", birthDate: "2015", deathDate: "", gender: "M" },
  "p-divya": { id: "p-divya", name: "Divya", birthDate: "2018", deathDate: "", gender: "F" },
  
  "p-aarav": { id: "p-aarav", name: "Aarav", birthDate: "2040", deathDate: "", gender: "M" },
};

const defaultData = {
  generations: { familyGens: {}, personGens: {} },
  tree: {
    id: "tree-1",
    name: "Family Tree",
    rootFamilyId: "fam-1" // Ramasamy & Lakshmi
  },
  families: {
    "fam-1": { id: "fam-1", displayName: "Ramasamy & Lakshmi" },
    "fam-suresh": { id: "fam-suresh", displayName: "Suresh & Meena" },
    "fam-ramesh": { id: "fam-ramesh", displayName: "Ramesh & Kala" },
    "fam-kumar": { id: "fam-kumar", displayName: "Kumar & Devi" },
    "fam-arun": { id: "fam-arun", displayName: "Arun & Priya" },
    "fam-ravi": { id: "fam-ravi", displayName: "Ravi" },
    "fam-karthik": { id: "fam-karthik", displayName: "Karthik" },
    "fam-divya": { id: "fam-divya", displayName: "Divya" },
  },
  familyMemberships: [
    { familyId: "fam-1", personId: "p-ramasamy", role: "parent" },
    { familyId: "fam-1", personId: "p-lakshmi", role: "parent" },
    { familyId: "fam-suresh", personId: "p-suresh", role: "parent" },
    { familyId: "fam-suresh", personId: "p-meena", role: "parent" },
    { familyId: "fam-ramesh", personId: "p-ramesh", role: "parent" },
    { familyId: "fam-ramesh", personId: "p-kala", role: "parent" },
    { familyId: "fam-kumar", personId: "p-kumar", role: "parent" },
    { familyId: "fam-kumar", personId: "p-devi", role: "parent" },
    { familyId: "fam-arun", personId: "p-arun", role: "parent" },
    { familyId: "fam-arun", personId: "p-priya", role: "parent" },
    { familyId: "fam-ravi", personId: "p-ravi", role: "parent" },
    { familyId: "fam-karthik", personId: "p-karthik", role: "parent" },
    { familyId: "fam-divya", personId: "p-divya", role: "parent" },
  ],
  parentChild: [
    // G1 -> G2
    { parentFamilyId: "fam-1", childId: "p-suresh" },
    { parentFamilyId: "fam-1", childId: "p-ramesh" },
    { parentFamilyId: "fam-1", childId: "p-kumar" },
    
    // G2 -> G3
    { parentFamilyId: "fam-suresh", childId: "p-arun" },
    { parentFamilyId: "fam-suresh", childId: "p-ravi" },
    
    // G3 -> G4
    { parentFamilyId: "fam-arun", childId: "p-karthik" },
    { parentFamilyId: "fam-arun", childId: "p-divya" },
    
    // G4 -> G5
    { parentFamilyId: "fam-karthik", childId: "p-aarav" },
  ],
  spouses: [
    { personAId: "p-ramasamy", personBId: "p-lakshmi" },
    { personAId: "p-suresh", personBId: "p-meena" },
    { personAId: "p-ramesh", personBId: "p-kala" },
    { personAId: "p-kumar", personBId: "p-devi" },
    { personAId: "p-arun", personBId: "p-priya" },
  ]
};

export const initialData = {
  activeProjectId: "proj-1",
  people: defaultPeople,
  projects: {
    "proj-1": {
      id: "proj-1",
      name: "Ramasamy Family Tree",
      data: defaultData,
      history: []
    }
  }
};
