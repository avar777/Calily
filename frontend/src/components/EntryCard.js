/*
 * Calily
 * Entry creation component for symptom journaling with photo upload
 *
 * Author: Ava Raper
 * Version: 3.0 - Added photo upload support
 */

import React, { useState, useRef } from 'react';

const EntryCard = ({ onAddEntry }) => {
  const [entryText, setEntryText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const fileInputRef = useRef(null);

  // Word bank for future autocomplete feature - not using it yet but it's here
  // Backend might want this later for better AI analysis
  const wordBank = [
    // Physical symptoms
    'fatigue', 'tired', 'exhausted', 'pain', 'ache', 'headache', 'migraine',
    'dizzy', 'nausea', 'nauseous', 'brain fog', 'foggy', 'weak', 'tremor',
    'fever', 'chills', 'sweating', 'rash', 'itch', 'swelling', 'inflammation',
    'stiff', 'sore', 'cramping', 'numbness', 'tingling',
    
    // Emotions - Happy/Positive
    'happy', 'joyful', 'content', 'grateful', 'thankful', 'blessed',
    'peaceful', 'calm', 'relaxed', 'hopeful', 'optimistic', 'excited',
    'energized', 'motivated', 'proud', 'confident', 'relieved',
    
    // Emotions - Sad/Low
    'sad', 'depressed', 'down', 'blue', 'melancholy', 'lonely', 'isolated',
    'hopeless', 'defeated', 'disappointed', 'discouraged', 'tearful',
    
    // Emotions - Anxious/Stressed
    'anxious', 'worried', 'stressed', 'nervous', 'panicked', 'tense',
    'overwhelmed', 'frantic', 'restless', 'on edge', 'uneasy', 'fearful',
    
    // Emotions - Angry/Frustrated
    'angry', 'frustrated', 'irritated', 'annoyed', 'mad', 'furious',
    'bitter', 'resentful', 'hostile', 'impatient', 'agitated',
    
    // Other emotional states
    'confused', 'lost', 'numb', 'empty', 'guilty', 'ashamed',
    'embarrassed', 'jealous', 'envious', 'bored', 'apathetic',
    
    // Activity level
    'resting', 'sleeping', 'napping', 'walking', 'exercising', 'working',
    'studying', 'socializing', 'inactive', 'active', 'busy'
  ];

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Make sure it's actually an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Keep it under 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Convert to base64 so we can store it
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setImageData({
        data: base64String,
        contentType: file.type,
        filename: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryText.trim()) {
      onAddEntry(entryText.trim(), imageData);
      // Clear everything after submission
      setEntryText('');
      handleRemoveImage();
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Symptom</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="input-field"
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="Enter a couple of words to describe how you're feeling and what you are doing."
          rows="3"
        />

        {/* Show image preview if they uploaded one */}
        {imagePreview && (
          <div style={{ 
            position: 'relative', 
            marginBottom: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                maxHeight: '300px', 
                objectFit: 'contain',
                display: 'block'
              }} 
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {/* Image upload button */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label 
            htmlFor="image-upload"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--card-bg)',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--card-bg)'}
          >
            📷 {imagePreview ? 'Change Photo' : 'Add Photo'}
          </label>
        </div>

        <button type="submit" className="btn-primary">
          Journal
        </button>
      </form>
    </div>
  );
};

export default EntryCard;