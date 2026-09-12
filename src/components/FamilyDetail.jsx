import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFamily } from '../store/FamilyStore';
import { getFamilyMembers, getFamilyChildrenIds, getFamiliesForPerson } from '../utils/relationshipUtils';
import { PersonCard } from './PersonCard';
import { Folder, Heart } from 'lucide-react';
import { useModals } from './modals/ModalProvider';
import './FamilyDetail.css';

export function FamilyDetail() {
  const { id } = useParams();
  const { state, dispatch } = useFamily();
  const { openModal } = useModals();
  
  const family = state.families[id];
  
  const { members, childrenFams, generation } = useMemo(() => {
    if (!family) return {};
    
    const mems = getFamilyMembers(state, id);
    const childIds = getFamilyChildrenIds(state, id);
    
    // Find all families where these children are core members
    const cFams = [];
    childIds.forEach(cId => {
      const fams = getFamiliesForPerson(state, cId);
      fams.forEach(fId => {
        cFams.push({ personId: cId, familyId: fId, family: state.families[fId] });
      });
    });
    
    return {
      members: mems,
      childrenFams: cFams,
      generation: state.generations?.familyGens?.[id]
    };
  }, [state, id, family]);

  if (!family) {
    return <div className="detail-empty">Family not found.</div>;
  }

  // To map spouses correctly in PersonCard
  const getSpouse = (personId) => {
    const spouseId = members.find(m => m.id !== personId)?.id;
    return spouseId ? state.people[spouseId] : null;
  };

  return (
    <div className="family-detail">
      <div className="detail-header">
        <div className="detail-title-area">
          <Folder size={28} className="detail-icon" />
          <h2 className="detail-title">
            {family.displayName.includes(' & ') ? (
              <span className="flex items-center gap-2">
                {family.displayName.split(' & ')[0]}
                <Heart size={20} style={{ color: '#d13438' }} fill="#d13438" />
                {family.displayName.split(' & ')[1]}
              </span>
            ) : (
              family.displayName
            )}
          </h2>
          {generation && <span className="badge">Generation {generation}</span>}
        </div>
        <div className="detail-actions">
          <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            Upload Photo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  dispatch({
                    type: 'EDIT_FAMILY',
                    payload: {
                      id: family.id,
                      updates: { photoUrl: reader.result }
                    }
                  });
                };
                reader.readAsDataURL(file);
              }
            }} />
          </label>
          <button className="btn" onClick={() => openModal('edit-family', { targetFamilyId: id })}>Edit Family</button>
          
          <div className="btn-group" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => openModal('add-child', { targetFamilyId: id })}>+ Child</button>
            <button className="btn btn-primary" onClick={() => openModal('add-sibling', { targetFamilyId: id })}>+ Sibling</button>
            {members.length < 2 && members[0] && (
              <button className="btn btn-primary" onClick={() => openModal('add-spouse', { targetPersonId: members[0].id })}>+ Spouse</button>
            )}
          </div>
        </div>
      </div>
      
      {family.photoUrl && (
        <div className="detail-section" style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={family.photoUrl} alt="Family Portrait" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'cover' }} />
        </div>
      )}
      
      <div className="detail-section">
        <h3 className="section-title">Members</h3>
        <div className="members-grid">
          {members.map(person => (
            <PersonCard 
              key={person.id} 
              person={person} 
              generation={state.generations.personGens[person.id]}
              spouse={getSpouse(person.id)}
            />
          ))}
        </div>
      </div>
      
      <div className="detail-section">
        <h3 className="section-title">Children Branches</h3>
        {childrenFams.length === 0 ? (
          <p className="text-muted">No children recorded.</p>
        ) : (
          <div className="children-list">
            {childrenFams.map((cFam, idx) => {
              const bioName = state.people[cFam.personId]?.name || '';
              const isBio = (part) => bioName.includes(part);
              
              return (
                <Link to={`/family/${cFam.familyId}`} key={`${cFam.familyId}-${idx}`} className="child-folder-link">
                  <Folder size={18} className="child-folder-icon" />
                  {cFam.family.displayName.includes(' & ') ? (
                    <span className="flex items-center gap-1">
                      <span style={{ fontWeight: isBio(cFam.family.displayName.split(' & ')[0]) ? 700 : 500 }}>
                        {cFam.family.displayName.split(' & ')[0]}
                      </span>
                      <Heart size={14} style={{ color: '#d13438', margin: '0 2px' }} fill="#d13438" />
                      <span style={{ fontWeight: isBio(cFam.family.displayName.split(' & ')[1]) ? 700 : 500 }}>
                        {cFam.family.displayName.split(' & ')[1]}
                      </span>
                    </span>
                  ) : (
                    <span style={{ fontWeight: isBio(cFam.family.displayName) ? 700 : 500 }}>
                      {cFam.family.displayName}
                    </span>
                  )}
                  {state.generations?.familyGens?.[cFam.familyId] && (
                    <span className="badge">G{state.generations.familyGens[cFam.familyId]}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="detail-section">
        <h3 className="section-title">Family Information</h3>
        <div className="info-card">
          <p className="text-muted">{family.notes || "No notes available."}</p>
        </div>
      </div>
    </div>
  );
}
