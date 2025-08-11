/*
 * Calily
 * Entry creation component for symptom journaling
 *
 * Author: Ava Raper
 * Version: 1.0
 */

import React, { useState } from 'react';

const EntryCard = ({ onAddEntry }) => {
  // state for entry text input
  const [entryText, setEntryText] = useState('');

  // this will handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryText.trim()) {
      // send entry to parent component
      onAddEntry(entryText.trim());
      // clear input after submission
      setEntryText('');
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
          placeholder="Enter a couple of words to describe how you're feeling and what you are doing"
          rows="3"
        />
        <button type="submit" className="btn-primary">
          Journal
        </button>
      </form>
    </div>
  );
};

export default EntryCard;