/*
 * Calily
 * Timeline view component for displaying recent health entries
 *
 * Author: Ava Raper
 * Version: 1.0
 */

import React from 'react';
import apiService from '../services/api';

const TimelineCard = ({ entries, onEntryDeleted }) => {
  // utility function for date formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // this will aks about deletion 
  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      // delete entry via API
      await apiService.deleteEntry(entryId);
      if (onEntryDeleted) {
        // notify parent component 
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
          // display recent 10 
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