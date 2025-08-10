import React from 'react';

const TimelineCard = ({ entries }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="card">
      <h2 className="card-title">Recent Flare-ups</h2>
      <div>
        {entries.length === 0 ? (
          <div className="no-entries">No flare-ups yet</div>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <div key={entry._id} className="entry-item">
              <div className="entry-text">{entry.text}</div>
              <div className="entry-date">{formatDate(entry.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimelineCard;