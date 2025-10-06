/*
 * Calily AI Insights Component
 * Displays AI-generated health insights and patterns
 * 
 * Author: Ava Raper
 * Version: 2.0
 */

import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AIInsightsCard = ({ entries }) => {
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [triggers, setTriggers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Generate insights when component mounts or entries change
  useEffect(() => {
    if (entries && entries.length > 0) {
      generateInsights();
    }
  }, [entries]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get last 7 days of entries for weekly summary
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekEntries = entries.filter(e => 
        new Date(e.createdAt) >= sevenDaysAgo
      );

      // Generate all insights in parallel
      const [summary, patternAnalysis, triggerAnalysis] = await Promise.all([
        aiService.generateWeeklySummary(weekEntries),
        aiService.analyzePatterns(entries),
        aiService.identifyTriggers(entries)
      ]);

      setWeeklySummary(summary);
      setPatterns(patternAnalysis);
      setTriggers(triggerAnalysis);

    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderWeeklySummary = () => {
    if (!weeklySummary) return null;

    return (
      <div className="ai-insight-section">
        <h3>This Week's Summary</h3>
        <div className="insight-content">
          <p className="insight-text">{weeklySummary.summary}</p>
          <div className="insight-meta">
            <small>
              Based on {weeklySummary.entryCount} entries
              {weeklySummary.dateRange && 
                ` from ${weeklySummary.dateRange.start} to ${weeklySummary.dateRange.end}`
              }
            </small>
          </div>
        </div>
      </div>
    );
  };

  const renderPatterns = () => {
    if (!patterns) return null;

    if (patterns.message) {
      return (
        <div className="ai-insight-section">
          <h3>Pattern Analysis</h3>
          <p className="insight-placeholder">{patterns.message}</p>
        </div>
      );
    }

    return (
      <div className="ai-insight-section">
        <h3>Pattern Analysis</h3>
        <div className="insight-content">
          <div className="insight-text pattern-analysis">
            {patterns.patterns.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="insight-meta">
            <small>
              Analyzed {patterns.entriesAnalyzed} of {patterns.totalEntries} entries
            </small>
          </div>
        </div>
      </div>
    );
  };

  const renderTriggers = () => {
    if (!triggers) return null;

    if (triggers.message) {
      return (
        <div className="ai-insight-section">
          <h3>Potential Triggers</h3>
          <p className="insight-placeholder">{triggers.message}</p>
        </div>
      );
    }

    return (
      <div className="ai-insight-section">
        <h3>Potential Triggers</h3>
        <div className="insight-content">
          <div className="insight-text">
            {triggers.triggers.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="insight-meta">
            <small>
              {triggers.severeEntryCount} worse days · {triggers.mildEntryCount} better days analyzed
            </small>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">AI Health Insights</h2>
        <div className="ai-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="card-title">AI Health Insights</h2>
        <div className="error-message">{error}</div>
        <button onClick={generateInsights} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">AI Health Insights</h2>
        <p>Start journaling to get AI-powered insights about your health patterns!</p>
      </div>
    );
  }

  return (
    <div className="card ai-insights-card">
      <div className="card-header">
        <h2 className="card-title">AI Health Insights</h2>
        <button 
          onClick={generateInsights} 
          className="btn-secondary"
          disabled={loading}
        >
          Refresh Insights
        </button>
      </div>

      <div className="ai-tabs">
        <button 
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Weekly Summary
        </button>
        <button 
          className={`tab-button ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
        <button 
          className={`tab-button ${activeTab === 'triggers' ? 'active' : ''}`}
          onClick={() => setActiveTab('triggers')}
        >
          Triggers
        </button>
      </div>

      <div className="ai-content">
        {activeTab === 'summary' && renderWeeklySummary()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'triggers' && renderTriggers()}
      </div>

      <div className="ai-disclaimer">
        <small>
          AI insights are observations only, not medical advice. 
          Always consult your healthcare provider for medical decisions.
        </small>
      </div>
    </div>
  );
};

export default AIInsightsCard;