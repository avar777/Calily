import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ChartCard = ({ entries = [] }) => {
  const svgRef = useRef();
  const [themeChangeKey, setThemeChangeKey] = useState(0);

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeChangeKey(prev => prev + 1); 
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }

    const symptomKeywords = [
      // Physical symptoms
      'fatigue', 'tired', 'exhausted', 'weak', 'weakness', 'energy', 'drained',
      'pain', 'ache', 'aches', 'sore', 'tender', 'burning', 'sharp pain', 'throbbing',
      'joint pain', 'back pain', 'neck pain', 'muscle aches', 'muscle pain', 'stiffness',
      'headache', 'migraine', 'dizzy', 'dizziness', 'lightheaded', 'vertigo',
      'nausea', 'sick', 'queasy', 'vomiting', 'threw up', 'stomach ache',
      'bloating', 'bloated', 'cramping', 'cramps', 'digestive', 'bowel',
      'fever', 'hot', 'chills', 'cold', 'shivering', 'sweating', 'night sweats',
      'swelling', 'swollen', 'inflammation', 'puffy', 'fluid retention',
      'rash', 'itchy', 'itching', 'skin problems', 'dry skin', 'flare',
      'shortness of breath', 'breathing', 'chest pain', 'chest tight',
      'numbness', 'tingling', 'pins and needles', 'burning sensation',
      'heartrate', 'heart racing', 'palpitations', 'irregular heartbeat',
      'anxious', 'anxiety', 'worried', 'stress', 'stressed', 'overwhelmed',
      'sad', 'depressed', 'down', 'emotional', 'crying', 'moody', 'irritable',
      'brain fog', 'confused', 'forgetful', 'concentration', 'focus',
      'restless', 'agitated', 'frustrated', 'angry', 'mood swings',
      'walking', 'running', 'exercise', 'workout', 'gym', 'yoga', 'stretching',
      'work', 'working', 'sitting', 'standing', 'driving', 'commute',
      'sleep', 'sleeping', 'nap', 'rest', 'bed', 'insomnia', 'woke up',
      'eating', 'meal', 'breakfast', 'lunch', 'dinner', 'cooking', 'food',
      'medication', 'pills', 'treatment', 'doctor', 'appointment',
      'weather', 'rain', 'cold weather', 'hot weather', 'humidity',
      'family', 'friends', 'social', 'alone', 'busy', 'relaxing'
    ];

    const symptomCounts = {};
    symptomKeywords.forEach(symptom => {
      symptomCounts[symptom] = 0;
    });

    entries.forEach(entry => {
      if (entry && entry.text && typeof entry.text === 'string') {
        const text = entry.text.toLowerCase();
        symptomKeywords.forEach(symptom => {
          if (text.includes(symptom)) {
            symptomCounts[symptom]++;
          }
        });
      }
    });

    const data = Object.entries(symptomCounts)
      .filter(([symptom, count]) => count > 0)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    if (data.length === 0) return;

    const chartBarColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--chart-bar').trim() || '#666';

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
      .attr("fill", chartBarColor); 

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
  }, [entries, themeChangeKey]); 

  return (
    <div className="card">
      <h2 className="card-title">Symptom Frequency</h2>
      <div className="chart-container">
        {!Array.isArray(entries) || entries.length === 0 ? ( 
          <div className="no-entries">No data to display</div>
        ) : (
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        )}
      </div>
    </div>
  );
};

export default ChartCard;