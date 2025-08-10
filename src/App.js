import React, { useState, useEffect } from 'react';
import './App.css';
import EntryCard from './components/EntryCard';
import TimelineCard from './components/TimelineCard';
import SearchCard from './components/SearchCard';
import ExportCard from './components/ExportCard';
import ChartCard from './components/ChartCard';
import apiService from './services/api';

function App() {
  const [entries, setEntries] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to load entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entryText) => {
    try {
      const newEntry = await apiService.createEntry(entryText);
      setEntries([newEntry, ...entries]);
    } catch (error) {
      console.error('Error adding entry:', error);
      setError('Failed to add entry. Please try again.');
    }
  };

  const handleEntryDeleted = (deletedEntryId) => {
    setEntries(prevEntries => 
      prevEntries.filter(entry => entry._id !== deletedEntryId)
    );
    
    setSearchResults(prevResults => 
      prevResults.filter(entry => entry._id !== deletedEntryId)
    );
  };

  const searchEntries = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiService.searchEntries(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching entries:', error);
      setError('Search failed. Please try again.');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="chunky-title">CALILY</h1>
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '1rem',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className="cards-container">
          <EntryCard onAddEntry={addEntry} />
          <TimelineCard 
            entries={entries} 
            loading={loading} 
            onEntryDeleted={handleEntryDeleted} 
          />
          <SearchCard 
            onSearch={searchEntries} 
            searchResults={searchResults}
            onEntryDeleted={handleEntryDeleted}
          />
          <ChartCard entries={entries} />
          <ExportCard entries={entries} />
        </div>
      </div>
    </div>
  );
}

export default App;