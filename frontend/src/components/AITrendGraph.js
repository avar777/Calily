/*
 * Calily AI Trend Graph Component
 * Displays AI-powered mood/symptom trend visualization with insights
 * 
 * Author: Ava Raper
 * Version: 1.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const AITrendGraph = ({ entries, medications = [] }) => {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const fetchTrendAnalysis = async () => {
    if (!entries || entries.length < 3) {
      setError('Need at least 3 journal entries to generate trends');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/trend-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ entries, medications })
      });

      const data = await response.json();

      if (response.ok) {
        setTrendData(data);
      } else {
        setError(data.error || 'Failed to generate trend analysis');
      }
    } catch (err) {
      console.error('Trend analysis error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trendData && trendData.dailyScores && svgRef.current) {
      drawGraph();
    }
  }, [trendData]);

  const drawGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = trendData.dailyScores.map(d => ({
      ...d,
      date: new Date(d.date)
    }));

    // X scale
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    // Y scale (1-10 score range)
    const y = d3.scaleLinear()
      .domain([1, 10])
      .range([height, 0]);

    // Line generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.score))
      .curve(d3.curveMonotoneX);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
      );

    // Add gradient for area under curve
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'var(--primary-color)')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'var(--primary-color)')
      .attr('stop-opacity', 0.05);

    // Add area under curve
    const area = d3.area()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.score))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary-color)')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.score))
      .attr('r', 5)
      .attr('fill', 'var(--primary-color)')
      .attr('stroke', 'var(--card-bg)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8);

        // Tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${x(d.date)},${y(d.score) - 20})`);

        const text = tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', 'var(--text-color)');

        text.append('tspan')
          .attr('x', 0)
          .attr('dy', 0)
          .attr('font-weight', 'bold')
          .text(`Score: ${d.score}/10`);

        text.append('tspan')
          .attr('x', 0)
          .attr('dy', '1.2em')
          .text(d.date.toLocaleDateString());
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5);

        g.selectAll('.tooltip').remove();
      });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(Math.min(data.length, 5))
        .tickFormat(d3.timeFormat('%m/%d'))
      )
      .selectAll('text')
      .attr('fill', 'var(--text-color)');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y)
        .ticks(5)
      )
      .selectAll('text')
      .attr('fill', 'var(--text-color)');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-color)')
      .text('Mood/Symptom Score');
  };

  const getTrendIcon = () => {
    if (!trendData) return '';
    switch (trendData.trendDirection) {
      case 'improving': return '';
      case 'declining': return '';
      case 'stable': return '';
      default: return '';
    }
  };

  const getTrendColor = () => {
    if (!trendData) return 'var(--text-color)';
    switch (trendData.trendDirection) {
      case 'improving': return '#28a745';
      case 'declining': return '#dc3545';
      case 'stable': return '#ffc107';
      default: return 'var(--text-color)';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">AI Trend Analysis</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p>Analyzing your health trends...</p>
        </div>
      </div>
    );
  }

  if (error || !entries || entries.length < 3) {
    return (
      <div className="card">
        <h2 className="card-title">AI Trend Analysis</h2>
        <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-color)' }}>
          {error || 'Need at least 3 journal entries to generate trend analysis'}
        </p>
        <button onClick={fetchTrendAnalysis} className="btn-primary">
          Generate Trends
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">AI Trend Analysis</h2>
      
      {!trendData ? (
        <button onClick={fetchTrendAnalysis} className="btn-primary">
          Generate AI Trend Analysis
        </button>
      ) : (
        <>
          {/* Trend Summary */}
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(0,0,0,0.02)', 
            borderRadius: '8px',
            marginBottom: '1rem',
            border: `1px solid var(--border-color)`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{getTrendIcon()}</span>
              <h3 style={{ margin: 0, color: 'var(--text-color)', textTransform: 'capitalize' }}>
                {trendData.trendDirection} Trend
              </h3>
              {trendData.trendPercentage !== 0 && (
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: 'bold',
                  color: 'var(--text-color)' 
                }}>
                  {trendData.trendPercentage > 0 ? '+' : ''}{trendData.trendPercentage.toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-color)' }}>
              {trendData.insights?.overall}
            </p>
          </div>

          {/* Graph */}
          <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
            <svg ref={svgRef} style={{ width: '100%', minWidth: '300px' }}></svg>
          </div>

          {/* Insights */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)', fontSize: '1rem' }}>
              Good Days Characterized By:
            </h4>
            <p style={{ 
              fontSize: '0.9rem', 
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              margin: 0
            }}>
              {trendData.insights?.goodDays}
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)', fontSize: '1rem' }}>
              Challenging Days Characterized By:
            </h4>
            <p style={{ 
              fontSize: '0.9rem', 
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              margin: 0
            }}>
              {trendData.insights?.challengingDays}
            </p>
          </div>

          {/* Correlations */}
          {trendData.correlations && trendData.correlations.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)', fontSize: '1rem' }}>
                Identified Correlations:
              </h4>
              {trendData.correlations.map((corr, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.5rem',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ color: 'var(--text-color)', fontWeight: '500' }}>{corr.factor}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'var(--text-color)',
                      textTransform: 'capitalize'
                    }}>
                      {corr.impact}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {corr.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          <div style={{ 
            padding: '0.75rem',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem',
            color: 'var(--text-color)'
          }}>
            <strong>Recommendation:</strong> {trendData.insights?.recommendations}
          </div>

          <button 
            onClick={fetchTrendAnalysis} 
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Refresh Analysis
          </button>
        </>
      )}
    </div>
  );
};

export default AITrendGraph;