/**
 * Calily - AI Insights Page
 * AI-powered health insights and trend analysis
 *
 * Author: Ava Raper
 * Version: 2.0
 */

import React from 'react';
import AIInsightsCard from '../AICard';
import AITrendGraph from '../AITrendGraph';

const AIInsightsPage = ({ entries, medications, onInsightsGenerated }) => {
  return (
    <div className="page-grid">
      <div className="page-section">
        <AIInsightsCard
          entries={entries}
          medications={medications}
          onInsightsGenerated={onInsightsGenerated}
        />
      </div>
      
      <div className="page-section">
        <AITrendGraph
          entries={entries}
          medications={medications}
        />
      </div>
    </div>
  );
};

export default AIInsightsPage;