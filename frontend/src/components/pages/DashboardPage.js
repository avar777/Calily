/**
 * Calily - Dashboard Page
 * Entry creation, recent flare-ups, and search functionality
 *
 * Author: Ava Raper
 * Version: 2.0
 */

import React, { useState } from 'react';
import EntryCard from '../EntryCard';
import TimelineCard from '../TimelineCard';
import SearchCard from '../SearchCard';
import apiService from '../../services/api';

const DashboardPage = ({ entries, onAddEntry, onEntryDeleted, onEntryUpdated }) => {
  const [searchResults, setSearchResults] = useState([]);

  const searchEntries = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiService.searchEntries(searchTerm);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching entries:', error);
    }
  };

  return (
    <div className="page-grid">
      <div className="page-section">
        <EntryCard onAddEntry={onAddEntry} />
      </div>
      
      <div className="page-section">
        <TimelineCard
          entries={entries}
          onEntryDeleted={onEntryDeleted}
          onEntryUpdated={onEntryUpdated}
        />
      </div>
      
      <div className="page-section">
        <SearchCard
          onSearch={searchEntries}
          searchResults={searchResults}
        />
      </div>
    </div>
  );
};

export default DashboardPage;