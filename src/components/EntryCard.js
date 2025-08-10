import React, { useState } from 'react';

const EntryCard = ({ onAddEntry }) => {
  const [entryText, setEntryText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryText.trim()) {
      onAddEntry(entryText.trim());
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