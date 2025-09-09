/*
 * Calily
 * Search functionality component with real-time results
 *
 * Author: Ava Raper
 * Version: 1.0
 */

import React, { useState } from 'react';

const SearchCard = ({ onSearch, searchResults }) => {
  // state for search input
  const [searchTerm, setSearchTerm] = useState('');

  // this will handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // trigger search
    onSearch(searchTerm);
  };

  // this will clear search results
  const handleClear = () => {
    setSearchTerm('');
    // clear search
    onSearch(''); 
  };

  // utility function for date formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="card">
      <h2 className="card-title">Search Your Journal</h2>
      <form onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="input-field search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entries"
          />
          {(searchTerm || searchResults.length > 0) && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={handleClear}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
      <div className="search-results">
        {searchResults.length > 0 && (
          <div>
            <h3>Results:</h3>
            {searchResults.map((entry) => (
              <div key={entry._id} className="entry-item">
                <div className="entry-text">{entry.text}</div>
                <div className="entry-date">{formatDate(entry.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCard;