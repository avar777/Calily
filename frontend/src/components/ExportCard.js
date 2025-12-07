/*
 * Calily
 * Data export component for downloading journal entries and AI insights
 *
 * Author: Ava Raper
 * Version: 4.0 - Export uses current insights from AIInsightsCard for matching date ranges
 */
import React, { useState, useEffect } from 'react';

const ExportCard = ({ entries, aiInsights }) => {
  const [exportMode, setExportMode] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showEntriesOptions, setShowEntriesOptions] = useState(false);
  const [showInsightsOptions, setShowInsightsOptions] = useState(false);
  const [entriesExportMode, setEntriesExportMode] = useState('all');
  const [entriesStartDate, setEntriesStartDate] = useState('');
  const [entriesEndDate, setEntriesEndDate] = useState('');

  // Set default dates when component mounts
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    setEndDate(todayStr);
    setStartDate(sevenDaysAgoStr);
    setEntriesEndDate(todayStr);
    setEntriesStartDate(sevenDaysAgoStr);
  }, []);

  // Filter entries by date range
  const filterEntriesByDateRange = (start, end) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime() + 86400000; // Add 24 hours to include end date
    
    return entries.filter(entry => {
      const entryTime = new Date(entry.createdAt).getTime();
      return entryTime >= startTime && entryTime < endTime;
    });
  };

  // Export entries to text file
  const exportToText = () => {
    let filteredEntries = entries;
    let dateRangeText = '';

    // Apply date filtering based on mode
    if (entriesExportMode === 'week') {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredEntries = filterEntriesByDateRange(
        sevenDaysAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      dateRangeText = `Last 7 Days (${sevenDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()})`;
    } else if (entriesExportMode === 'month') {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredEntries = filterEntriesByDateRange(
        thirtyDaysAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      dateRangeText = `Last 30 Days (${thirtyDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()})`;
    } else if (entriesExportMode === 'custom' && entriesStartDate && entriesEndDate) {
      filteredEntries = filterEntriesByDateRange(entriesStartDate, entriesEndDate);
      dateRangeText = `Custom Range (${new Date(entriesStartDate).toLocaleDateString()} - ${new Date(entriesEndDate).toLocaleDateString()})`;
    } else {
      dateRangeText = 'All Time';
    }

    // Format each entry with date and time
    const textData = filteredEntries.map(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const time = new Date(entry.createdAt).toLocaleTimeString();
      return `${date} ${time}: ${entry.text}`;
    }).join('\n\n');

    // Create export summary
    let summary = `CALILY JOURNAL EXPORT: ${new Date().toLocaleDateString()}\n`;
    summary += `Date Range: ${dateRangeText}\n`;
    summary += `Total Entries: ${filteredEntries.length}\n\n`;
    
    if (filteredEntries.length === 0) {
      summary += `No entries found for the selected date range.\n`;
    } else {
      summary += textData;
    }

    // Create downloadable blob
    const dataBlob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    const modeText = entriesExportMode === 'all' ? 'export' : `${entriesExportMode}-export`;
    link.download = `calily-${modeText}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export with current insights (from AIInsightsCard)
  const exportWithCurrentInsights = () => {
    if (!aiInsights || (!aiInsights.weeklySummary && !aiInsights.patterns && !aiInsights.triggers)) {
      alert('Please generate AI insights first before exporting.');
      return;
    }

    const { weeklySummary, patterns, triggers, doctorVisit, dateRange } = aiInsights;
    
    // Warn if insights date range doesn't match typical export scenarios
    if (dateRange && dateRange.start && dateRange.end) {
      const insightText = `The AI insights were generated for: ${dateRange.start} - ${dateRange.end}\n\nThe exported journal entries will match this same date range.`;
      console.log(insightText);
    }

    // Determine date range text
    let dateRangeText = 'Generated Insights';
    if (dateRange && dateRange.start && dateRange.end) {
      dateRangeText = `${dateRange.start} - ${dateRange.end}`;
    }

    // Get the filtered entries that match the insights
    let filteredEntries = entries;
    if (dateRange && dateRange.start && dateRange.end) {
      // Convert display dates back to ISO format for filtering
      const startISO = new Date(dateRange.start).toISOString().split('T')[0];
      const endISO = new Date(dateRange.end).toISOString().split('T')[0];
      filteredEntries = filterEntriesByDateRange(startISO, endISO);
    }

    // Format filtered entries
    const textData = filteredEntries.map(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const time = new Date(entry.createdAt).toLocaleTimeString();
      return `${date} ${time}: ${entry.text}`;
    }).join('\n\n');

    // Build the complete export
    let fullExport = `CALILY JOURNAL EXPORT WITH AI INSIGHTS\n`;
    fullExport += `Export Date: ${new Date().toLocaleDateString()}\n`;
    fullExport += `Insights Date Range: ${dateRangeText}\n`;
    fullExport += `Total Entries: ${filteredEntries.length}\n\n`;
    fullExport += `${'='.repeat(60)}\n\n`;

    // Add AI insights section
    fullExport += `AI HEALTH INSIGHTS\n`;
    fullExport += `${'='.repeat(60)}\n\n`;

    // Weekly Summary
    if (weeklySummary && weeklySummary.summary) {
      fullExport += `SUMMARY\n`;
      fullExport += `${'-'.repeat(60)}\n`;
      fullExport += `${weeklySummary.summary}\n\n`;
      fullExport += `Based on ${weeklySummary.entryCount} entries`;
      if (weeklySummary.dateRange) {
        fullExport += ` from ${weeklySummary.dateRange.start} to ${weeklySummary.dateRange.end}`;
      }
      fullExport += `\n\n`;
    }

    // Pattern Analysis
    if (patterns) {
      fullExport += `PATTERN ANALYSIS\n`;
      fullExport += `${'-'.repeat(60)}\n`;
      if (patterns.message) {
        fullExport += `${patterns.message}\n\n`;
      } else if (patterns.patterns) {
        fullExport += `${patterns.patterns}\n\n`;
        fullExport += `Analyzed ${patterns.entriesAnalyzed} of ${patterns.totalEntries} entries\n\n`;
      }
    }

    // Triggers
    if (triggers) {
      fullExport += `POTENTIAL TRIGGERS\n`;
      fullExport += `${'-'.repeat(60)}\n`;
      if (triggers.message) {
        fullExport += `${triggers.message}\n\n`;
      } else if (triggers.triggers) {
        fullExport += `${triggers.triggers}\n\n`;
        fullExport += `${triggers.severeEntryCount} worse days · ${triggers.mildEntryCount} better days analyzed\n\n`;
      }
    }

    // Doctor Visit Preparation
    if (doctorVisit) {
      fullExport += `DOCTOR VISIT PREPARATION\n`;
      fullExport += `${'-'.repeat(60)}\n`;
      if (doctorVisit.message) {
        fullExport += `${doctorVisit.message}\n\n`;
      } else if (doctorVisit.summary) {
        fullExport += `${doctorVisit.summary}\n\n`;
        fullExport += `Based on ${doctorVisit.entriesIncluded} recent entries`;
        if (doctorVisit.medicationsIncluded > 0) {
          fullExport += ` · ${doctorVisit.medicationsIncluded} medications listed`;
        }
        fullExport += `\n\n`;
      }
    }

    fullExport += `${'='.repeat(60)}\n\n`;

    // Add journal entries
    fullExport += `JOURNAL ENTRIES (${filteredEntries.length})\n`;
    fullExport += `${'='.repeat(60)}\n\n`;
    
    if (filteredEntries.length === 0) {
      fullExport += `No entries found for the selected date range.\n\n`;
    } else {
      fullExport += textData;
    }

    // Add disclaimer
    fullExport += `\n\n${'='.repeat(60)}\n`;
    fullExport += `\nDISCLAIMER: AI insights are observations only, not medical advice.\n`;
    fullExport += `Always consult your healthcare provider for medical decisions.\n`;

    // Create downloadable blob
    const dataBlob = new Blob([fullExport], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    const dateStr = dateRange?.mode || 'insights';
    link.download = `calily-${dateStr}-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasInsights = aiInsights && (aiInsights.weeklySummary || aiInsights.patterns || aiInsights.triggers);

  return (
    <div className="card">
      <h2 className="card-title">Export Journal</h2>
      <p>Download your journal entries and insights</p>
      
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Download Entries Only */}
        <div style={{ 
          padding: '1rem', 
          border: '1px solid var(--border-color)', 
          borderRadius: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: showEntriesOptions ? '1rem' : 0,
            cursor: 'pointer'
          }}
          onClick={() => setShowEntriesOptions(!showEntriesOptions)}
          >
            <strong> Download Entries Only</strong>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-color)' }}>
              {showEntriesOptions ? '▼' : '▶'}
            </span>
          </div>
          
          {showEntriesOptions && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                  Date Range:
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="all"
                      checked={entriesExportMode === 'all'}
                      onChange={(e) => setEntriesExportMode(e.target.value)}
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <span>All entries</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="week"
                      checked={entriesExportMode === 'week'}
                      onChange={(e) => setEntriesExportMode(e.target.value)}
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <span>Last 7 days</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="month"
                      checked={entriesExportMode === 'month'}
                      onChange={(e) => setEntriesExportMode(e.target.value)}
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <span>Last 30 days</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="custom"
                      checked={entriesExportMode === 'custom'}
                      onChange={(e) => setEntriesExportMode(e.target.value)}
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <span>Custom range</span>
                  </label>
                </div>
              </div>
              
              {entriesExportMode === 'custom' && (
                <div style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        Start Date:
                      </label>
                      <input
                        type="date"
                        value={entriesStartDate}
                        onChange={(e) => setEntriesStartDate(e.target.value)}
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
                        value={entriesEndDate}
                        onChange={(e) => setEntriesEndDate(e.target.value)}
                        className="input-field"
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={exportToText} 
                className="btn-primary"
                disabled={entries.length === 0 || (entriesExportMode === 'custom' && (!entriesStartDate || !entriesEndDate))}
                style={{ width: '100%' }}
              >
                Download Entries
              </button>
              
              {entries.length === 0 && (
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'center' }}>
                  No entries to export yet
                </p>
              )}
              
              {entriesExportMode === 'custom' && (!entriesStartDate || !entriesEndDate) && (
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'center' }}>
                  Please select both start and end dates
                </p>
              )}
            </>
          )}
        </div>

        {/* Download with Current AI Insights */}
        <div style={{ 
          padding: '1rem', 
          border: '1px solid var(--border-color)', 
          borderRadius: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: showInsightsOptions ? '1rem' : 0,
            cursor: 'pointer'
          }}
          onClick={() => setShowInsightsOptions(!showInsightsOptions)}
          >
            <strong> Download with Current AI Insights</strong>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-color)' }}>
              {showInsightsOptions ? '▼' : '▶'}
            </span>
          </div>
          
          {showInsightsOptions && (
            <>
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <p style={{ margin: 0 }}>
                  This will export the insights currently displayed in the AI Health Insights card above. 
                  Select your desired date range in the AI Insights section, generate the insights, 
                  then download them here.
                </p>
              </div>

              {hasInsights && aiInsights.dateRange && (
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <strong>Current Insights Date Range:</strong>
                  <div style={{ 
                    padding: '0.5rem', 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                    marginTop: '0.25rem'
                  }}>
                    {aiInsights.dateRange.start} - {aiInsights.dateRange.end}
                    <br />
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      Mode: {aiInsights.dateRange.mode === 'week' ? 'Last 7 days' : 
                             aiInsights.dateRange.mode === 'month' ? 'Last 30 days' : 
                             'Custom range'}
                    </span>
                  </div>
                </div>
              )}
              
              <button 
                onClick={exportWithCurrentInsights} 
                className="btn-primary"
                disabled={!hasInsights}
                style={{ width: '100%' }}
              >
                Download Current Insights
              </button>
              
              {!hasInsights && (
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'center' }}>
                  Generate AI insights first to export them
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportCard;