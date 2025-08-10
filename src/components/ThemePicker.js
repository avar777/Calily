import React, { useState, useEffect } from 'react';

const ThemePicker = () => {
  const [showPicker, setShowPicker] = useState(false);
  
  const themes = [
    {
      name: 'Default',
      primary: '#83bdf3ff',
      background: '#ffffffff',
      cardBg: '#a1a1a1ff',
      text: '#ffffffff',
      border: '#000000',
      inputBorder: '#000000',
      buttonText: '#ffffffff',
      deleteBtn: '#83bdf3ff',
      deleteBtnText: '#ffffff',
      chartBar: '#83bdf3ff',
      entryBorder: '#000000'
    },
    {
      name: 'Dark',
      primary: '#83bdf3ff',
      background: '#474747ff',
      cardBg: '#919191ff',
      text: '#ffffffff',
      border: '#000000',
      inputBorder: '#000000',
      buttonText: '#ffffffff',
      deleteBtn: '#83bdf3ff',
      deleteBtnText: '#ffffff',
      chartBar: '#83bdf3ff',
      entryBorder: '#000000'
    },
    {
      name: 'Moody',
      primary: '#d9ba8e',
      background: '#303e5a',
      cardBg: '#b27a49',
      text: '#ffffffff',
      border: '#f3f3f3ff',
      inputBorder: '#ffffffff',
      buttonText: '#ffffff',
      deleteBtn: '#4c6444',
      deleteBtnText: '#ffffff',
      chartBar: '#4c6444',
      entryBorder: '#ffffffff'
    },
    {
      name: 'Vibrant',
      primary: '#44ff60ff',
      background: '#70caf4ff',
      cardBg: '#fd89b3',
      text: '#ffffffff',
      border: '#ffff80ff',
      inputBorder: '#a7d3ffff',
      buttonText: '#000000ff',
      deleteBtn: '#ffff96ff',
      deleteBtnText: '#000000ff',
      chartBar: '#a9f9b5ff',
      entryBorder: '#a7d3ffff'
    },
    {
      name: 'Warm',
      primary: '#eacfa5',
      background: '#8c9579',
      cardBg: '#e6bb96',
      text: '#6d6d6dff',
      border: '#be9a98',
      inputBorder: '#be9a98',
      buttonText: '#6d6d6dff',
      deleteBtn: '#aa7a79',
      deleteBtnText: '#e4e4e4ff',
      chartBar: '#be9a98',
      entryBorder: '#be9a98'
    }
  ];

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--bg-color', theme.background);
    root.style.setProperty('--card-bg', theme.cardBg);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--input-border', theme.inputBorder);
    root.style.setProperty('--button-text', theme.buttonText);
    root.style.setProperty('--delete-btn', theme.deleteBtn);
    root.style.setProperty('--delete-btn-text', theme.deleteBtnText);
    root.style.setProperty('--chart-bar', theme.chartBar);
    root.style.setProperty('--entry-border', theme.entryBorder);
    
    window.dispatchEvent(new CustomEvent('themeChanged'));
    
    localStorage.setItem('calily-theme', JSON.stringify(theme));
    setShowPicker(false);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('calily-theme');
    if (savedTheme) {
      try {
        applyTheme(JSON.parse(savedTheme));
      } catch (error) {
        console.error('Error loading saved theme:', error);
      }
    }
  }, []);

  return (
    <div className="theme-picker">
      <button
        className="theme-btn"
        onClick={() => setShowPicker(!showPicker)}
        title="Change theme"
      >
        ☰
      </button>
      {showPicker && (
        <div className="theme-dropdown">
          <h4>Choose Theme</h4>
          {themes.map((theme) => (
            <div
              key={theme.name}
              className="theme-option"
              onClick={() => applyTheme(theme)}
            >
              <span>{theme.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemePicker;