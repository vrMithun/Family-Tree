import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, ChevronUp, Folder, Heart, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useModals } from './modals/ModalProvider';
import { useFamily } from '../store/FamilyStore';
import './FolderNode.css';

export function FolderNode({ node, level = 0, globalExpandState, toggleCounter, parentFamilyId, siblingIds }) {
  const [expanded, setExpanded] = useState(level < 2);
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after' | null
  const { state, dispatch } = useFamily();
  const { openModal } = useModals();
  const rowRef = useRef(null);

  // React to global expand/collapse commands
  useEffect(() => {
    if (toggleCounter === undefined || toggleCounter === 0) return;
    if (globalExpandState === 'expand-all') {
      setExpanded(true);
    } else if (globalExpandState === 'collapse-all') {
      setExpanded(false);
    }
  }, [toggleCounter, globalExpandState]);

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
    e.dataTransfer.setData('application/family-id', node.familyId);
    e.dataTransfer.setData('application/parent-family-id', parentFamilyId || '');
    e.dataTransfer.setData('application/child-id', node.bioChildId || '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const draggedParent = e.dataTransfer.types.includes('application/parent-family-id');
    
    // Determine if this is a sibling reorder (show before/after indicator)
    if (rowRef.current && parentFamilyId) {
      const rect = rowRef.current.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        setDropPosition('before');
      } else {
        setDropPosition('after');
      }
    }
    
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropPosition(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropPosition(null);
    
    const draggedFamilyId = e.dataTransfer.getData('application/family-id');
    const draggedParentFamilyId = e.dataTransfer.getData('application/parent-family-id');
    
    if (!draggedFamilyId || draggedFamilyId === node.familyId) return;
    
    // Check if this is a sibling reorder (same parent)
    if (parentFamilyId && draggedParentFamilyId === parentFamilyId && siblingIds) {
      // Reorder siblings
      const currentOrder = [...siblingIds];
      
      // Find the child IDs for dragged and target
      // We need to find which childId corresponds to which familyId
      const draggedIndex = currentOrder.findIndex(id => {
        const fams = (state.familyMemberships || [])
          .filter(m => m.personId === id && m.role === 'parent')
          .map(m => m.familyId);
        return fams.includes(draggedFamilyId);
      });
      
      const targetIndex = currentOrder.findIndex(id => {
        const fams = (state.familyMemberships || [])
          .filter(m => m.personId === id && m.role === 'parent')
          .map(m => m.familyId);
        return fams.includes(node.familyId);
      });
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Remove dragged and insert at the target position
      const [movedId] = currentOrder.splice(draggedIndex, 1);
      
      // Determine position based on drop indicator
      const rect = rowRef.current?.getBoundingClientRect();
      const midY = rect ? rect.top + rect.height / 2 : 0;
      const insertBefore = e.clientY < midY;
      
      let insertIndex = currentOrder.indexOf(currentOrder[targetIndex > draggedIndex ? targetIndex - 1 : targetIndex]);
      if (insertIndex === -1) insertIndex = currentOrder.length;
      if (!insertBefore) insertIndex += 1;
      
      currentOrder.splice(insertIndex, 0, movedId);
      
      dispatch({
        type: 'REORDER_SIBLINGS',
        payload: {
          parentFamilyId,
          orderedChildIds: currentOrder
        }
      });
    } else {
      // Move subtree to new parent
      dispatch({
        type: 'MOVE_SUBTREE',
        payload: {
          targetFamilyId: draggedFamilyId,
          newParentFamilyId: node.familyId
        }
      });
    }
  };

  // Compute children's childIds for sibling context
  const childSiblingIds = hasChildren
    ? node.childrenNodes.map(cn => {
        // The bioChildId was the childId linked to this family via parentChild
        // We need to find the personId for each child node
        const members = (state.familyMemberships || [])
          .filter(m => m.familyId === cn.familyId && m.role === 'parent')
          .map(m => m.personId);
        // Find which one is a child of node.familyId
        const childId = (state.parentChild || [])
          .find(pc => pc.parentFamilyId === node.familyId && members.includes(pc.childId));
        return childId?.childId || members[0];
      }).filter(Boolean)
    : [];

  const dropClass = dropPosition === 'before' ? 'drop-before' : dropPosition === 'after' ? 'drop-after' : '';

  // Find current node's index among siblings for move up/down
  const hasSiblings = parentFamilyId && siblingIds && siblingIds.length > 1;
  let myIndexInSiblings = -1;
  let myChildId = null;
  if (hasSiblings) {
    // Find which childId corresponds to this node's familyId
    for (let i = 0; i < siblingIds.length; i++) {
      const fams = (state.familyMemberships || [])
        .filter(m => m.personId === siblingIds[i] && m.role === 'parent')
        .map(m => m.familyId);
      if (fams.includes(node.familyId)) {
        myIndexInSiblings = i;
        myChildId = siblingIds[i];
        break;
      }
    }
  }
  const canMoveUp = myIndexInSiblings > 0;
  const canMoveDown = myIndexInSiblings >= 0 && myIndexInSiblings < (siblingIds?.length || 0) - 1;

  const handleMoveUp = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canMoveUp) return;
    const newOrder = [...siblingIds];
    [newOrder[myIndexInSiblings - 1], newOrder[myIndexInSiblings]] = [newOrder[myIndexInSiblings], newOrder[myIndexInSiblings - 1]];
    dispatch({ type: 'REORDER_SIBLINGS', payload: { parentFamilyId, orderedChildIds: newOrder } });
  };

  const handleMoveDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canMoveDown) return;
    const newOrder = [...siblingIds];
    [newOrder[myIndexInSiblings], newOrder[myIndexInSiblings + 1]] = [newOrder[myIndexInSiblings + 1], newOrder[myIndexInSiblings]];
    dispatch({ type: 'REORDER_SIBLINGS', payload: { parentFamilyId, orderedChildIds: newOrder } });
  };

  return (
    <div className="folder-node-wrapper">
      <div 
        ref={rowRef}
        className={`folder-node-row ${isDragOver ? 'drag-over' : ''} ${dropClass}`}
        onClick={handleClick}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {parentFamilyId && siblingIds && siblingIds.length > 1 && (
          <div className="drag-handle" title="Drag to reorder">
            <GripVertical size={14} />
          </div>
        )}
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
          {hasSiblings && (
            <div className="reorder-buttons">
              <button 
                className={`reorder-btn ${!canMoveUp ? 'disabled' : ''}`}
                title="Move Up"
                disabled={!canMoveUp}
                onClick={handleMoveUp}
              >
                <ArrowUp size={14} />
              </button>
              <button 
                className={`reorder-btn ${!canMoveDown ? 'disabled' : ''}`}
                title="Move Down"
                disabled={!canMoveDown}
                onClick={handleMoveDown}
              >
                <ArrowDown size={14} />
              </button>
            </div>
          )}
          <div 
            className="delete-btn action-btn danger" 
            title="Delete Family Branch"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              openModal('delete-family', { 
                targetFamilyId: node.familyId, 
                hasChildren: hasChildren 
              });
            }}
          >
            <Trash2 size={16} />
          </div>
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

          {/* Render Children Families */}
          {node.childrenNodes && node.childrenNodes.map((childNode, index) => (
            <FolderNode 
              key={`${childNode.familyId}-${index}`} 
              node={childNode} 
              level={level + 1} 
              globalExpandState={globalExpandState}
              toggleCounter={toggleCounter}
              parentFamilyId={node.familyId}
              siblingIds={childSiblingIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
