import React from 'react';
import apiService from '../services/api';

const TimelineCard = ({ entries, onEntryDeleted }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
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
      <div>
        {entries.length === 0 ? (
          <div className="no-entries">No flare-ups yet</div>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <div key={entry._id} className="entry-item-rect">
              <div className="entry-text">{entry.text}</div>
              <div className="entry-footer">
                <div className="entry-date">{formatDate(entry.createdAt)}</div>
                <button
                  className="delete-btn-rect"
                  onClick={() => handleDelete(entry._id)}
                  title="Delete entry"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimelineCard;