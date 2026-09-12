# Project-Based Architecture

The application has been successfully upgraded to support multiple independent family trees through a new **Project-Based Architecture**.

## What Changed
- **Isolated Projects**: The application state has been restructured to support a dictionary of multiple `projects`. Each project holds its own distinct collection of `people`, `families`, `relationships`, and `generations`.
- **Project Switcher UI**: We have added a new "Project Selector" to the top of the Sidebar. 
  - The current project name (e.g., "Ramasamy Family Tree") is displayed at the top left.
  - Clicking it reveals a dropdown menu containing all your active projects.
- **Create New Tree**: Inside the Project Selector dropdown, there is now an option to **+ Create New Tree**. This will prompt you for a name and instantly initialize a completely blank workspace, safely isolated from your other data.
- **Seamless State Abstraction**: The core UI components (`FamilyExplorer`, `MembersList`, etc.) seamlessly read and write to the currently *active* project, ensuring no cross-contamination between different family trees.

## Verification
1. Click on **Ramasamy Family Tree** at the top of the sidebar.
2. Click **+ Create New Tree**.
3. Name it "My New Project" and hit enter.
4. The screen will clear as you are transported into a fresh, empty workspace!
5. Click on the sidebar title again and select "Ramasamy Family Tree" to seamlessly swap back to your original data.
