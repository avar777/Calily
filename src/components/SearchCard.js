import React, { useState } from 'react';

const SearchCard = ({ onSearch, searchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="card">
      <h2 className="card-title">Search Your Journal</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search entries"
        />
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