import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, Heart, Plus } from 'lucide-react';
import { ContextMenu } from './ContextMenu';
import { useModals } from './modals/ModalProvider';
import { useFamily } from '../store/FamilyStore';
import './FolderNode.css';

export function FolderNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(level < 2); // default expand first few levels
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const { dispatch } = useFamily();
  const { openModal } = useModals();

  if (!node) return null;

  const hasChildren = node.childrenNodes && node.childrenNodes.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/family/${node.familyId}`);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', node.familyId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const draggedFamilyId = e.dataTransfer.getData('text/plain');
    if (draggedFamilyId && draggedFamilyId !== node.familyId) {
      dispatch({
        type: 'MOVE_SUBTREE',
        payload: {
          targetFamilyId: draggedFamilyId,
          newParentFamilyId: node.familyId
        }
      });
    }
  };

  return (
    <div className="folder-node-wrapper">
      <div 
        className={`folder-node-row ${isDragOver ? 'drag-over' : ''}`}
        onClick={handleClick}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="folder-icon-area" onClick={handleToggle}>
          {hasChildren ? (
            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span style={{ width: 16, display: 'inline-block' }} />
          )}
          <Folder size={18} className="folder-icon" />
        </div>
        
        <div className="folder-content">
          {(() => {
            const isBio = (part) => node.bioChildName && node.bioChildName.includes(part);
            if (node.family.displayName.includes(' & ')) {
              const parts = node.family.displayName.split(' & ');
              return (
                <span className="folder-name flex items-center gap-1">
                  <span style={{ fontWeight: isBio(parts[0]) ? 700 : 500 }}>{parts[0]}</span>
                  <Heart size={14} style={{ color: '#d13438', margin: '0 2px' }} fill="#d13438" />
                  <span style={{ fontWeight: isBio(parts[1]) ? 700 : 500 }}>{parts[1]}</span>
                </span>
              );
            }
            return (
              <span className="folder-name" style={{ fontWeight: isBio(node.family.displayName) ? 700 : 500 }}>
                {node.family.displayName}
              </span>
            );
          })()}
          {node.generation && (
            <span className="badge">G{node.generation}</span>
          )}
        </div>
        
        <div className="folder-actions" onClick={e => e.stopPropagation()}>
          <ContextMenu familyId={node.familyId} />
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className={`folder-children level-${level}`}>
          <div 
            className="add-line-btn" 
            title="Add Child"
            onClick={(e) => {
              e.stopPropagation();
              openModal('add-child', { targetFamilyId: node.familyId });
            }}
          >
            <Plus size={12} strokeWidth={3} />
          </div>
          {node.childrenNodes.map((childNode, index) => (
            <FolderNode key={`${childNode.familyId}-${index}`} node={childNode} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
