/*
 * Calily
 * Main React application component 
 *
 * Author: Ava Raper
 * Version: 1.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import EntryCard from './EntryCard';
import MedCard from './MedCard';
import TimelineCard from './TimelineCard';
import SearchCard from './SearchCard';
import ExportCard from './ExportCard';
import ThemePicker from './ThemePicker';
import AIInsightsCard from './AICard';
import AITrendGraph from './AITrendGraph';
import SettingsModal from './SettingsModal';
import apiService from '../services/api';

function App() {
  // state management using React Hooks
  const [entries, setEntries] = useState([]);
  const [medications, setMedications] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [error, setError] = useState(null);

  // fetch data on mount
  useEffect(() => {
    fetchEntries();
    fetchMedications();
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

  const fetchMedications = async () => {
    try {
      const data = await apiService.getMedications();
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setMedications([]);
    }
  };

  // this will add new entries 
  const addEntry = async (entryText, imageData = null) => {
    try {
      // creates new entry with optional image
      const newEntry = await apiService.createEntry(entryText, imageData);
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

  // this will handle entry updates
  const handleEntryUpdated = (updatedEntry) => {
    // update the entry in the entries array
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry._id === updatedEntry._id ? updatedEntry : entry
      )
    );
    // update in search results too if present
    setSearchResults(prevResults =>
      prevResults.map(entry =>
        entry._id === updatedEntry._id ? updatedEntry : entry
      )
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

  // Handle AI insights updates
  const handleInsightsGenerated = useCallback((insights) => {
    setAiInsights(insights);
  }, []);

  return (
  <div className="app">
    <ThemePicker />
    <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    <div className="container">
      <div style={{ position: 'relative' }}>
        <h1 className="chunky-title">CALILY</h1>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '0',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--primary-color)',
            padding: '8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
      {error && (
        <div className="error-message">
          {error}
          <button
            onClick={() => setError(null)}
            className="error-close-btn"
          >
            ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢
          </button>
        </div>
      )}
      <div className="cards-container">
        <EntryCard onAddEntry={addEntry} />
        <MedCard />
        <TimelineCard
          entries={entries}
          onEntryDeleted={handleEntryDeleted}
          onEntryUpdated={handleEntryUpdated}
        />
        <SearchCard
          onSearch={searchEntries}
          searchResults={searchResults}
        />
        <AITrendGraph entries={entries} medications={medications} />
        <AIInsightsCard 
          entries={entries} 
          medications={medications} 
          onInsightsGenerated={handleInsightsGenerated}
        />
        <ExportCard entries={entries} aiInsights={aiInsights} />
      </div>
    </div>
  </div>
);
}

export default App;