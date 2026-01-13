/**
 * Calily
 * Main application component with page-based navigation
 *
 * Author: Ava Raper
 * Version: 2.1 - Theme picker removed from header
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import DashboardPage from './pages/DashboardPage';
import MedicationsPage from './pages/MedicationsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import ExportPage from './pages/ExportPage';
import SettingsModal from './SettingsModal';
import apiService from '../services/api';

function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [medications, setMedications] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntries();
    fetchMedications();
  }, []);

  const fetchEntries = async () => {
    try {
      setError(null);
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

  const addEntry = async (entryText, imageData = null) => {
    try {
      const newEntry = await apiService.createEntry(entryText, imageData);
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
  };

  const handleEntryUpdated = (updatedEntry) => {
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry._id === updatedEntry._id ? updatedEntry : entry
      )
    );
  };

  const handleInsightsGenerated = useCallback((insights) => {
    setAiInsights(insights);
  }, []);

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            entries={entries}
            onAddEntry={addEntry}
            onEntryDeleted={handleEntryDeleted}
            onEntryUpdated={handleEntryUpdated}
          />
        );
      case 'medications':
        return <MedicationsPage />;
      case 'ai-insights':
        return (
          <AIInsightsPage
            entries={entries}
            medications={medications}
            onInsightsGenerated={handleInsightsGenerated}
          />
        );
      case 'export':
        return (
          <ExportPage
            entries={entries}
            aiInsights={aiInsights}
          />
        );
      default:
        return <DashboardPage entries={entries} onAddEntry={addEntry} />;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="app-header">
          <h1 className="app-title">CALILY</h1>
          <div className="header-actions">
            <button
              onClick={() => setShowSettings(true)}
              className="settings-button"
              title="Settings"
            />
          </div>
        </div>

        <nav className="navigation">
          <button
            className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-button ${currentPage === 'medications' ? 'active' : ''}`}
            onClick={() => setCurrentPage('medications')}
          >
            Medications
          </button>
          <button
            className={`nav-button ${currentPage === 'ai-insights' ? 'active' : ''}`}
            onClick={() => setCurrentPage('ai-insights')}
          >
            AI Insights
          </button>
          <button
            className={`nav-button ${currentPage === 'export' ? 'active' : ''}`}
            onClick={() => setCurrentPage('export')}
          >
            Export
          </button>
        </nav>

        {error && (
          <div className="error-message">
            {error}
            <button
              onClick={() => setError(null)}
              className="error-close-btn"
            >
              ×
            </button>
          </div>
        )}

        <div className="page-content">
          {renderPage()}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default Dashboard;