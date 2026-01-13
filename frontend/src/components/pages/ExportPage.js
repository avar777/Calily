/**
 * Calily - Export Page
 * Data export functionality
 *
 * Author: Ava Raper
 * Version: 2.0
 */

import React from 'react';
import ExportCard from '../ExportCard';

const ExportPage = ({ entries, aiInsights }) => {
  return (
    <div className="page-single">
      <ExportCard
        entries={entries}
        aiInsights={aiInsights}
      />
    </div>
  );
};

export default ExportPage;