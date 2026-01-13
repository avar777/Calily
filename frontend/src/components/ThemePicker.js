/*
 * Calily
 * Theme picker component using CSS variables for dynamic styling
 *
 * Author: Ava Raper
 * Version: 2.1 - Gear icon update
 */

import React, { useState, useEffect } from 'react';

const ThemePicker = () => {
  const [showPicker, setShowPicker] = useState(false);
  
  const themes = [
    {
      name: 'Default',
      primary: '#7a9b7f',
      background: '#f5f1e8',
      cardBg: '#ffffff',
      text: '#2c3e3f',
      navtext: '#2c3e3f',
      border: '#d98572',
      inputBorder: '#d98572',
      buttonText: '#ffffff',
      deleteBtn: '#d98572',
      deleteBtnText: '#ffffff',
      chartBar: '#7a9b7f',
      entryBorder: '#d98572',
      setting: '#d4c5b0'
    },
    {
      name: 'Light',
      primary: '#83bdf3ff',
      background: '#ffffffff',
      cardBg: '#a1a1a1ff',
      text: '#ffffffff',
      navtext: '#000000',
      border: '#000000',
      inputBorder: '#000000',
      buttonText: '#ffffffff',
      deleteBtn: '#83bdf3ff',
      deleteBtnText: '#ffffff',
      chartBar: '#83bdf3ff',
      entryBorder: '#d98572',
      setting: '#a1a1a1ff'
    },
    {
      name: 'Dark',
      primary: '#83bdf3ff',
      background: '#474747ff',
      cardBg: '#919191ff',
      text: '#ffffffff',
      navtext: '#ffffffff',
      border: '#000000',
      inputBorder: '#000000',
      buttonText: '#ffffffff',
      deleteBtn: '#83bdf3ff',
      deleteBtnText: '#ffffff',
      chartBar: '#83bdf3ff',
      entryBorder: '#d98572',
      setting: '#474747ff'
    }
  ];

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--title-color', theme.primary);
    root.style.setProperty('--nav-color', theme.navtext);
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
    root.style.setProperty('--setting-button-color', theme.setting);
    
    // Let other components know the theme changed
    window.dispatchEvent(new CustomEvent('themeChanged'));
    
    // Save to localStorage so it persists
    localStorage.setItem('calily-theme', JSON.stringify(theme));
    setShowPicker(false);
  };

  // Load saved theme on mount
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
        🎨
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