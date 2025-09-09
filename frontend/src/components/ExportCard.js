/*
 * Calily
 * Data export component for downloading journal entries
 *
 * Author: Ava Raper
 * Version: 1.0
 */

import React from 'react';

const ExportCard = ({ entries }) => {
  // this will export entries to text file
  const exportToText = () => {
    // format each entry with date and time
    const textData = entries.map(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const time = new Date(entry.createdAt).toLocaleTimeString();
      return `${date} ${time}: ${entry.text}`;
    }).join('\n\n');

    // create export summary
    const summary = `CALILY JOURNAL EXPORT: ${new Date().toLocaleDateString()}\nTotal Entries: ${entries.length}\n\n${textData}`;

    // create downloadable blob
    const dataBlob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    // trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `calily-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <h2 className="card-title">Export Journal</h2>
      <p>Download your journal entries</p>
      
      <div style={{ marginTop: '1rem' }}>
        <button 
          onClick={exportToText} 
          className="btn-primary"
          disabled={entries.length === 0}
        >
          Download Text
        </button>
      </div>
    </div>
  );
};

export default ExportCard;