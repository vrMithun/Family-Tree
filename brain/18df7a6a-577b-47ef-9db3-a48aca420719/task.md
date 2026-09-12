# Project-Based Architecture Tasks

- [x] Update `mockData.js` to export a `projects` wrapper around the initial data.
- [x] Refactor `FamilyStore.jsx` to manage `projects` and `activeProjectId` in the global state.
- [x] Modify `useFamily` to return the `data` of the active project as `state`, abstracting the project layer from UI components.
- [x] Update `FamilyStore.jsx` reducer so that all tree mutation actions (`ADD_CHILD`, `EDIT_FAMILY`, etc.) correctly target the active project's data object.
- [x] Add `CREATE_PROJECT` and `SWITCH_PROJECT` actions to `FamilyStore.jsx`.
- [x] Add a Project Selector and "New Tree" button to `Sidebar.jsx`.
- [x] Verify that creating a new project yields a blank canvas and switching restores the mock data.
