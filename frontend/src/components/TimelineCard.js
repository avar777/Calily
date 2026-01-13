/*
 * Calily
 * Timeline view component for displaying recent health entries with photo support
 *
 * Author: Ava Raper
 * Version: 3.0 - Added photo display and management
 */

import React, { useState, useRef } from 'react';
import apiService from '../services/api';

const TimelineCard = ({ entries, onEntryDeleted, onEntryUpdated }) => {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Word bank for future use (autocomplete, etc.)
  const wordBank = [
    'fatigue', 'tired', 'exhausted', 'pain', 'ache', 'headache', 'migraine',
    'dizzy', 'nausea', 'nauseous', 'brain fog', 'foggy', 'weak', 'tremor',
    'fever', 'chills', 'sweating', 'rash', 'itch', 'swelling', 'inflammation',
    'stiff', 'sore', 'cramping', 'numbness', 'tingling',
    'happy', 'joyful', 'content', 'grateful', 'thankful', 'blessed',
    'peaceful', 'calm', 'relaxed', 'hopeful', 'optimistic', 'excited',
    'energized', 'motivated', 'proud', 'confident', 'relieved',
    'sad', 'depressed', 'down', 'blue', 'melancholy', 'lonely', 'isolated',
    'hopeless', 'defeated', 'disappointed', 'discouraged', 'tearful',
    'anxious', 'worried', 'stressed', 'nervous', 'panicked', 'tense',
    'overwhelmed', 'frantic', 'restless', 'on edge', 'uneasy', 'fearful',
    'angry', 'frustrated', 'irritated', 'annoyed', 'mad', 'furious',
    'bitter', 'resentful', 'hostile', 'impatient', 'agitated',
    'confused', 'lost', 'numb', 'empty', 'guilty', 'ashamed',
    'embarrassed', 'jealous', 'envious', 'bored', 'apathetic',
    'resting', 'sleeping', 'napping', 'walking', 'exercising', 'working',
    'studying', 'socializing', 'inactive', 'active', 'busy'
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setEditImagePreview(base64String);
      setEditImage({
        data: base64String,
        contentType: file.type,
        filename: file.name
      });
      setRemoveImageFlag(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditImage = () => {
    setEditImagePreview(null);
    setEditImage(null);
    setRemoveImageFlag(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enter edit mode for an entry
  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditText(entry.text);
    if (entry.image && entry.image.data) {
      setEditImagePreview(entry.image.data);
    } else {
      setEditImagePreview(null);
    }
    setEditImage(null);
    setRemoveImageFlag(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditImage(null);
    setEditImagePreview(null);
    setRemoveImageFlag(false);
  };

  // Save the edited entry
  const saveEdit = async (entryId) => {
    if (!editText.trim()) {
      alert('Entry cannot be empty');
      return;
    }

    try {
      const updatedEntry = await apiService.updateEntry(
        entryId, 
        editText.trim(), 
        editImage, 
        removeImageFlag
      );
      if (onEntryUpdated) {
        onEntryUpdated(updatedEntry);
      }
      cancelEdit();
    } catch (error) {
      alert('Failed to update entry. Please try again.');
      console.error('Error updating entry:', error);
    }
  };

  // Delete with confirmation
  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteEntry(entryId);
      if (onEntryDeleted) {
        onEntryDeleted(entryId);
      }
    } catch (error) {
      alert('Failed to delete entry. Please try again.');
      console.error('Error deleting entry:', error);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Recent Flare-ups</h2>
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {entries.length === 0 ? (
          <div className="no-entries">No flare-ups yet</div>
        ) : (
          entries.map((entry) => (
            <div key={entry._id} className="entry-item-rect">
              {editingId === entry._id ? (
                // Edit mode
                <div className="edit-mode">
                  <textarea
                    className="input-field"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="3"
                    autoFocus
                  />

                  {/* Image Preview in Edit Mode */}
                  {editImagePreview && !removeImageFlag && (
                    <div style={{ 
                      position: 'relative', 
                      marginTop: '0.5rem',
                      marginBottom: '0.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={editImagePreview} 
                        alt="Preview" 
                        style={{ 
                          width: '100%', 
                          maxHeight: '200px', 
                          objectFit: 'contain',
                          display: 'block'
                        }} 
                      />
                      <button
                        type="button"
                        onClick={handleRemoveEditImage}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Image Upload in Edit Mode */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id={`image-upload-${entry._id}`}
                    />
                    <label 
                      htmlFor={`image-upload-${entry._id}`}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--card-bg)',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'inline-block'
                      }}
                    >
                      📷 {editImagePreview && !removeImageFlag ? 'Change Photo' : 'Add Photo'}
                    </label>
                  </div>

                  {/* Edit buttons */}
                  <div className="entry-footer">
                    <button
                      className="btn-primary"
                      onClick={() => saveEdit(entry._id)}
                      style={{ marginRight: '8px' }}
                    >
                      Save
                    </button>
                    <button
                      className="delete-btn-rect"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  {/* Show entry image if there is one */}
                  {entry.image && entry.image.data && (
                    <div 
                      style={{ 
                        marginBottom: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedImage(entry.image.data)}
                    >
                      <img 
                        src={entry.image.data} 
                        alt="Entry photo" 
                        style={{ 
                          width: '100%', 
                          maxHeight: '200px', 
                          objectFit: 'cover',
                          display: 'block'
                        }} 
                      />
                    </div>
                  )}

                  <div className="entry-text">{entry.text}</div>
                  <div className="entry-footer">
                    <div className="entry-date">{formatDate(entry.createdAt)}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Edit icon */}
                      <button
                        className="icon-btn"
                        onClick={() => startEdit(entry)}
                        title="Edit"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.7,
                          color: 'var(--text-color)'
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor"
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span className="tooltip">Edit</span>
                      </button>
                      
                      {/* Delete icon */}
                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(entry._id)}
                        title="Delete"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.7,
                          color: 'var(--text-color)'
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor"
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        <span className="tooltip">Delete</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Image lightbox for viewing full-size images */}
      {expandedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
          }}
          onClick={() => setExpandedImage(null)}
        >
          <img 
            src={expandedImage} 
            alt="Expanded view" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              objectFit: 'contain'
            }} 
          />
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TimelineCard;