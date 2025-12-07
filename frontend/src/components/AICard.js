/*
 * Calily AI Insights Component
 * Displays AI-generated health insights and patterns with date range selection
 * 
 * Author: Ava Raper
 * Version: 4.0 - Complete with Doctor Visit Prep
 */

import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AIInsightsCard = ({ entries, medications = [], onInsightsGenerated }) => {
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [triggers, setTriggers] = useState(null);
  const [doctorVisit, setDoctorVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Date range selection
  const [dateRangeMode, setDateRangeMode] = useState('week'); // 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateOptions, setShowDateOptions] = useState(false);

  // Set default dates when component mounts
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Note: Auto-generation removed to prevent stale insights
  // Users must explicitly click "Generate Insights" button with their chosen date range

  // Notify parent component when insights change
  useEffect(() => {
    if (onInsightsGenerated && (weeklySummary || patterns || triggers || doctorVisit)) {
      onInsightsGenerated({
        weeklySummary,
        patterns,
        triggers,
        doctorVisit,
        dateRange: { start: startDate, end: endDate, mode: dateRangeMode }
      });
    }
  }, [weeklySummary, patterns, triggers, doctorVisit, startDate, endDate, dateRangeMode, onInsightsGenerated]);

  // Filter entries by date range
  const filterEntriesByDateRange = (start, end) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime() + 86400000; // Add 24 hours to include end date
    
    return entries.filter(entry => {
      const entryTime = new Date(entry.createdAt).getTime();
      return entryTime >= startTime && entryTime < endTime;
    });
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      let filteredEntries = entries;
      let dateRange = { start: '', end: '' };

      // Apply date filtering based on mode
      if (dateRangeMode === 'week') {
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredEntries = filterEntriesByDateRange(
          sevenDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        dateRange = {
          start: sevenDaysAgo.toLocaleDateString(),
          end: today.toLocaleDateString()
        };
      } else if (dateRangeMode === 'month') {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredEntries = filterEntriesByDateRange(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        dateRange = {
          start: thirtyDaysAgo.toLocaleDateString(),
          end: today.toLocaleDateString()
        };
      } else if (dateRangeMode === 'custom' && startDate && endDate) {
        filteredEntries = filterEntriesByDateRange(startDate, endDate);
        dateRange = {
          start: new Date(startDate).toLocaleDateString(),
          end: new Date(endDate).toLocaleDateString()
        };
      }

      if (filteredEntries.length === 0) {
        setWeeklySummary({ 
          summary: 'No entries found for the selected date range.',
          entryCount: 0,
          dateRange
        });
        setPatterns({ message: 'No entries found for the selected date range.' });
        setTriggers({ message: 'No entries found for the selected date range.' });
        setDoctorVisit({ message: 'No entries found for the selected date range.' });
        return;
      }

      // Generate all insights in parallel
      const [summary, patternAnalysis, triggerAnalysis, doctorPrep] = await Promise.all([
        aiService.generateWeeklySummary(filteredEntries),
        aiService.analyzePatterns(filteredEntries),
        aiService.identifyTriggers(filteredEntries),
        aiService.prepareDoctorVisit(filteredEntries, medications)
      ]);

      // Add date range to summary
      if (summary) {
        summary.dateRange = dateRange;
      }

      setWeeklySummary(summary);
      setPatterns(patternAnalysis);
      setTriggers(triggerAnalysis);
      setDoctorVisit(doctorPrep);

    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Formatting function for all AI text
  const formatAIText = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const formatted = [];
    let currentList = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for headers (bold text with ** or ## or #)
      if (trimmed.match(/^\*\*(.+?)\*\*:?/) || trimmed.startsWith('##') || trimmed.startsWith('# ')) {
        // Push any accumulated list items first
        if (currentList.length > 0) {
          formatted.push({ type: 'list', items: currentList });
          currentList = [];
        }
        
        let headerText = trimmed;
        if (trimmed.startsWith('**')) {
          headerText = trimmed.replace(/^\*\*(.+?)\*\*:?/, '$1').trim();
        } else if (trimmed.startsWith('##')) {
          headerText = trimmed.replace(/^##\s*/, '').trim();
        } else if (trimmed.startsWith('# ')) {
          headerText = trimmed.replace(/^#\s*/, '').trim();
        }
        
        // Remove any remaining ** markers
        headerText = headerText.replace(/\*\*/g, '');
        formatted.push({ type: 'header', text: headerText, key: `header-${index}` });
      }
      // Check for bullet points (*, -, Ã¢â‚¬Â¢)
      else if (trimmed.match(/^[\*\-Ã¢â‚¬Â¢]\s/)) {
        const bulletText = trimmed.replace(/^[\*\-Ã¢â‚¬Â¢]\s/, '').trim();
        const cleanBulletText = bulletText.replace(/\*\*/g, '');
        currentList.push(cleanBulletText);
      }
      // Check for numbered lists
      else if (/^\d+\.\s/.test(trimmed)) {
        const numberText = trimmed.replace(/^\d+\.\s/, '').trim();
        const cleanNumberText = numberText.replace(/\*\*/g, '');
        currentList.push(cleanNumberText);
      }
      // Regular paragraph text
      else if (trimmed) {
        // Push any accumulated list items first
        if (currentList.length > 0) {
          formatted.push({ type: 'list', items: currentList });
          currentList = [];
        }
        
        const cleanText = trimmed.replace(/\*\*/g, '');
        formatted.push({ type: 'paragraph', text: cleanText, key: `p-${index}` });
      }
    });

    // Push any remaining list items
    if (currentList.length > 0) {
      formatted.push({ type: 'list', items: currentList });
    }

    return formatted;
  };

  const renderFormattedContent = (content) => {
    return content.map((item, index) => {
      if (item.type === 'header') {
        return <h4 key={item.key || index} className="insight-subheader">{item.text}</h4>;
      } else if (item.type === 'list') {
        return (
          <ul key={`list-${index}`} className="insight-list">
            {item.items.map((li, i) => (
              <li key={`li-${index}-${i}`}>{li}</li>
            ))}
          </ul>
        );
      } else if (item.type === 'paragraph') {
        return <p key={item.key || index} className="insight-paragraph">{item.text}</p>;
      }
      return null;
    });
  };

  const renderWeeklySummary = () => {
    if (!weeklySummary) return null;

    const formattedContent = formatAIText(weeklySummary.summary);

    return (
      <div className="ai-insight-section">
        <h3>Summary</h3>
        <div className="insight-content">
          <div className="insight-text">
            {renderFormattedContent(formattedContent)}
          </div>
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

    const formattedContent = formatAIText(patterns.patterns);

    return (
      <div className="ai-insight-section">
        <h3>Pattern Analysis</h3>
        <div className="insight-content">
          <div className="insight-text">
            {renderFormattedContent(formattedContent)}
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

    const formattedContent = formatAIText(triggers.triggers);

    return (
      <div className="ai-insight-section">
        <h3>Potential Triggers</h3>
        <div className="insight-content">
          <div className="insight-text">
            {renderFormattedContent(formattedContent)}
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

  const renderDoctorVisit = () => {
    if (!doctorVisit) return null;

    if (doctorVisit.message) {
      return (
        <div className="ai-insight-section">
          <h3>Doctor Visit Preparation</h3>
          <p className="insight-placeholder">{doctorVisit.message}</p>
        </div>
      );
    }

    const formattedContent = formatAIText(doctorVisit.summary);

    return (
      <div className="ai-insight-section">
        <h3>Doctor Visit Preparation</h3>
        <div className="insight-content">
          <div className="insight-text">
            {renderFormattedContent(formattedContent)}
          </div>
          <div className="insight-meta">
            <small>
              Based on {doctorVisit.entriesIncluded} recent entries
              {doctorVisit.medicationsIncluded > 0 && ` · ${doctorVisit.medicationsIncluded} medications listed`}
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
        <p>Start journaling to get AI-powered insights about your health patterns.</p>
      </div>
    );
  }

  return (
    <div className="card ai-insights-card">
      <div className="card-header">
        <h2 className="card-title">AI Health Insights</h2>
      </div>

      {/* Date Range Selector */}
      <div style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        border: '1px solid var(--border-color)', 
        borderRadius: '6px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)'
      }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowDateOptions(!showDateOptions)}
        >
          <strong>Date Range</strong>
          <span style={{ fontSize: '1.2rem' }}>
            {showDateOptions ? '▼' : '▶'}
          </span>
        </div>
        
        {showDateOptions && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="week"
                  checked={dateRangeMode === 'week'}
                  onChange={(e) => setDateRangeMode(e.target.value)}
                  style={{ accentColor: 'var(--primary-color)' }}
                />
                <span>Last 7 days</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="month"
                  checked={dateRangeMode === 'month'}
                  onChange={(e) => setDateRangeMode(e.target.value)}
                  style={{ accentColor: 'var(--primary-color)' }}
                />
                <span>Last 30 days</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="custom"
                  checked={dateRangeMode === 'custom'}
                  onChange={(e) => setDateRangeMode(e.target.value)}
                  style={{ accentColor: 'var(--primary-color)' }}
                />
                <span>Custom range</span>
              </label>
            </div>
            
            {dateRangeMode === 'custom' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </div>
            )}
            
            <button 
              onClick={generateInsights} 
              className="btn-primary"
              disabled={loading || (dateRangeMode === 'custom' && (!startDate || !endDate))}
              style={{ width: '100%' }}
            >
              Generate Insights
            </button>
          </div>
        )}
      </div>

      <div className="ai-tabs">
        <button 
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
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
        <button 
          className={`tab-button ${activeTab === 'doctor' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctor')}
        >
          Doctor Visit
        </button>
      </div>

      <div className="ai-content" style={{
        maxHeight: '500px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {activeTab === 'summary' && renderWeeklySummary()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'triggers' && renderTriggers()}
        {activeTab === 'doctor' && renderDoctorVisit()}
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