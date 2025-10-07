/*
 * Calily
 * Main React application component 
 *
 * Author: Ava Raper
 * Version: 1.0
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import EntryCard from './components/EntryCard';
import TimelineCard from './components/TimelineCard';
import SearchCard from './components/SearchCard';
import ExportCard from './components/ExportCard';
import ChartCard from './components/ChartCard';
import ThemePicker from './components/ThemePicker';
import AIInsightsCard from './components/AICard';
import apiService from './services/api';

function App() {
  // state management using React Hooks
  const [entries, setEntries] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [error, setError] = useState(null);

  // fetch data on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  // async data fetching 
  const fetchEntries = async () => {
    try {
      setError(null);
      // get all entries from backend
      const data = await apiService.getEntries();
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to load entries. Please try again.');
      setEntries([]);
    }
  };

  // this will add new entries 
  const addEntry = async (entryText) => {
    try {
      // creates new entry 
      const newEntry = await apiService.createEntry(entryText);
      // update with new entry first 
      setEntries([newEntry, ...entries]);
    } catch (error) {
      console.error('Error adding entry:', error);
      setError('Failed to add entry. Please try again.');
    }
  };

  // this will handle entry delection
  const handleEntryDeleted = (deletedEntryId) => {
    // remove the entry from array
    setEntries(prevEntries =>
      prevEntries.filter(entry => entry._id !== deletedEntryId)
    );
    // remove from the search array 
    setSearchResults(prevResults =>
      prevResults.filter(entry => entry._id !== deletedEntryId)
    );
  };

  // this will handle the search
  const searchEntries = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      // this will use API for the search card
      const results = await apiService.searchEntries(searchTerm);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching entries:', error);
      setError('Search failed. Please try again.');
    }
  };

  return (
    <div className="app">
      <ThemePicker />
      <div className="container">
        <h1 className="chunky-title">CALILY</h1>
        {error && (
          <div className="error-message">
            {error}
            <button
              onClick={() => setError(null)}
              className="error-close-btn"
            >
              ✕
            </button>
          </div>
        )}
        <div className="cards-container">
          <EntryCard onAddEntry={addEntry} />
          <TimelineCard
            entries={entries}
            onEntryDeleted={handleEntryDeleted}
          />
          <SearchCard
            onSearch={searchEntries}
            searchResults={searchResults}
          />
          <AIInsightsCard entries={entries} />
          
          <TimelineCard entries={entries} onEntryDeleted={handleEntryDeleted} />
          <SearchCard onSearch={searchEntries} searchResults={searchResults} />
          <ChartCard entries={entries} />
          <ExportCard entries={entries} />
        </div>
      </div>
    </div>
  );
}

export default App;