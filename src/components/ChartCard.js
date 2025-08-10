import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ChartCard = ({ entries }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!entries.length) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const symptomKeywords = [
      'fatigue', 'joint pain', 'skin problems', 'rash', 'muscle aches', 
      'muscle weakness', 'fever', 'swollen glands', 'numbness', 'tingling',
      'shortness of breath', 'chest pain', 'weight loss', 'weight gain',
      'digestive issues', 'abdominal pain', 'bloating', 'nausea', 'vomiting',
      'stiffness', 'swelling', 'inflammation', 'butterfly rash', 'dry patches',
      'sores', 'chills', 'night sweats', 'headache', 'dizzy', 'tired',
      'weak', 'pain', 'cramping', 'bowel changes', 'emotional',
      'difficulty moving', 'lymph nodes', 'heat', 'redness'
    ];

    const symptomCounts = {};
    symptomKeywords.forEach(symptom => {
      symptomCounts[symptom] = 0;
    });

    entries.forEach(entry => {
      const text = entry.text.toLowerCase();
      symptomKeywords.forEach(symptom => {
        if (text.includes(symptom)) {
          symptomCounts[symptom]++;
        }
      });
    });

    const data = Object.entries(symptomCounts)
      .filter(([symptom, count]) => count > 0)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    if (data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.symptom))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([height, 0]);

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.symptom))
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.count))
      .attr("height", d => height - yScale(d.count))
      .attr("fill", "#666");

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(yScale));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Frequency");

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Symptoms");

  }, [entries]);

  return (
    <div className="card">
      <h2 className="card-title">Symptom Frequency</h2>
      <div className="chart-container">
        {entries.length === 0 ? (
          <div className="no-entries">No data to display</div>
        ) : (
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        )}
      </div>
    </div>
  );
};

export default ChartCard;