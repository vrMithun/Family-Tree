import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useFamily } from '../store/FamilyStore';
import { PersonCard } from './PersonCard';
import './FamilyDetail.css';

export function MembersList() {
  const { state } = useFamily();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focusSearch') === 'true' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [location.search]);

  const members = useMemo(() => {
    let allMembers = Object.values(state.people);
    if (searchTerm) {
      allMembers = allMembers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // Sort alphabetically
    return allMembers.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.people, searchTerm]);

  // Find spouse for person card
  const getSpouse = (personId) => {
    const spouseLink = state.spouses.find(s => s.personAId === personId || s.personBId === personId);
    if (spouseLink) {
      const spouseId = spouseLink.personAId === personId ? spouseLink.personBId : spouseLink.personAId;
      return state.people[spouseId];
    }
    return null;
  };

  return (
    <div className="family-detail" style={{ maxWidth: '1200px' }}>
      <div className="detail-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
        <h2 className="detail-title">All Members</h2>
        <input 
          ref={searchInputRef}
          type="text" 
          placeholder="Search members..." 
          className="form-control" 
          style={{ width: '100%', maxWidth: '400px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="members-grid">
        {members.map(person => (
          <PersonCard 
            key={person.id} 
            person={person} 
            generation={state.generations?.personGens?.[person.id]}
            spouse={getSpouse(person.id)}
            isClickable={true}
          />
        ))}
      </div>
      
      {members.length === 0 && (
        <div className="detail-empty">No members found.</div>
      )}
    </div>
  );
}
