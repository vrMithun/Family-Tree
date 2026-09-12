import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider } from './store/FamilyStore';
import { Sidebar } from './components/Sidebar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { FamilyExplorer } from './components/FamilyExplorer';
import { FamilyDetail } from './components/FamilyDetail';
import { MembersList } from './components/MembersList';
import { CustomFamilyTree } from './components/CustomFamilyTree';
import { PlaceholderView } from './components/PlaceholderView';
import { ModalProvider } from './components/modals/ModalProvider';
import './App.css';

function AppLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Breadcrumbs />
        <div className="content-scroll">
          <Routes>
            <Route path="/" element={<FamilyExplorer />} />
            <Route path="/family/:id" element={<FamilyDetail />} />
            <Route path="/members" element={<MembersList />} />
            <Route path="/person/:id/tree" element={<CustomFamilyTree />} />
            <Route path="/search" element={<PlaceholderView title="Search" />} />
            <Route path="/settings" element={<PlaceholderView title="Settings" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <FamilyProvider>
      <ModalProvider>
        <Router>
          <AppLayout />
        </Router>
      </ModalProvider>
    </FamilyProvider>
  );
}

export default App;
