/*
 * Calily - Enhanced MedCard Component
 * Medication tracker with MULTIPLE doses per day support
 * 
 * Author: Ava Raper
 * Version: 2.0 - ENHANCED
 */

import React, { useState, useEffect } from 'react';
import './MedCard.css';
import apiService from '../services/api';

const MedCard = () => {
  const [medications, setMedications] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    timeOfDay: 'Morning',
    notes: '',
    trackOnly: false  // Just track vs daily reminders
  });
  const [error, setError] = useState(null);

  // Load meds when component loads
  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const data = await apiService.getMedications();
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Failed to load medications');
    }
  };

  const addMedication = async (e) => {
    e.preventDefault();
    if (!newMed.name.trim() || !newMed.dosage.trim()) {
      setError('Name and dosage are required');
      return;
    }

    try {
      const addedMed = await apiService.createMedication(newMed);
      setMedications([addedMed, ...medications]);
      setNewMed({
        name: '',
        dosage: '',
        frequency: 'Daily',
        timeOfDay: 'Morning',
        notes: '',
        trackOnly: false
      });
      setIsAdding(false);
      setError(null);
    } catch (error) {
      console.error('Error adding medication:', error);
      setError('Failed to add medication');
    }
  };

  // Figure out which doses to show based on frequency
  const getDoseTimes = (frequency) => {
    switch(frequency) {
      case 'Twice Daily':
        return ['Morning', 'Evening'];
      case 'Three Times Daily':
        return ['Morning', 'Afternoon', 'Evening'];
      case 'Daily':
      case 'As Needed':
      case 'Weekly':
      default:
        return ['Anytime'];
    }
  };

  const toggleDose = async (medId, doseTime) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const med = medications.find(m => m._id === medId);
      
      // Check if this specific dose was taken today
      const doseKey = `${today}-${doseTime}`;
      const wasTaken = med.takenDoses?.includes(doseKey);

      const updatedMed = await apiService.toggleMedicationDose(medId, doseKey, !wasTaken);
      
      setMedications(medications.map(m => 
        m._id === medId ? updatedMed : m
      ));
    } catch (error) {
      console.error('Error toggling dose:', error);
      setError('Failed to update medication');
    }
  };

  const deleteMedication = async (medId) => {
    if (!window.confirm('Remove this medication?')) return;

    try {
      await apiService.deleteMedication(medId);
      setMedications(medications.filter(m => m._id !== medId));
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Failed to delete medication');
    }
  };

  const isDoseTaken = (med, doseTime) => {
    const today = new Date().toISOString().split('T')[0];
    const doseKey = `${today}-${doseTime}`;
    return med.takenDoses?.includes(doseKey);
  };

  return (
    <div className="card med-card">
      <div className="card-header">
        <h2>💊 Medications</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="btn-secondary"
          >
            + Add Med
          </button>
        )}
      </div>

      {error && (
        <div className="med-error">
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Add Medication Form */}
      {isAdding && (
        <form onSubmit={addMedication} className="med-form">
          <input
            type="text"
            placeholder="Medication name"
            value={newMed.name}
            onChange={(e) => setNewMed({...newMed, name: e.target.value})}
            className="input-field"
            required
          />
          <input
            type="text"
            placeholder="Dosage (e.g., 10mg, 2.5mg)"
            value={newMed.dosage}
            onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
            className="input-field"
            required
          />
          
          <div className="med-selects">
            <select
              value={newMed.frequency}
              onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
              className="input-field"
            >
              <option>Daily</option>
              <option>Twice Daily</option>
              <option>Three Times Daily</option>
              <option>As Needed</option>
              <option>Weekly</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Notes (e.g., take with food)"
            value={newMed.notes}
            onChange={(e) => setNewMed({...newMed, notes: e.target.value})}
            className="input-field"
          />

          <div className="track-only-option">
            <label className="track-only-label">
              <input
                type="checkbox"
                checked={newMed.trackOnly}
                onChange={(e) => setNewMed({...newMed, trackOnly: e.target.checked})}
                className="track-only-checkbox"
              />
              <span>Only track (no daily reminders)</span>
            </label>
            <small className="track-only-hint">
              Check this if you just want to track your medication without daily checkboxes
            </small>
          </div>

          <div className="med-form-buttons">
            <button type="submit" className="btn-primary">
              Add Medication
            </button>
            <button 
              type="button" 
              onClick={() => {
                setIsAdding(false);
                setNewMed({
                  name: '',
                  dosage: '',
                  frequency: 'Daily',
                  timeOfDay: 'Morning',
                  notes: ''
                });
              }} 
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Medications List */}
      {medications.length === 0 && !isAdding ? (
        <p className="med-empty">No medications tracked yet. Add one to get started!</p>
      ) : (
        <div className="med-list">
          {medications.map((med) => {
            const doseTimes = getDoseTimes(med.frequency);
            
            return (
              <div key={med._id} className="med-item">
                <div className="med-info-section">
                  <div className="med-header-row">
                    <div className="med-name-dosage">
                      <div className="med-name">{med.name}</div>
                      <div className="med-dosage-badge">{med.dosage} mg</div>
                    </div>
                    <button
                      onClick={() => deleteMedication(med._id)}
                      className="med-delete-btn"
                      title="Remove medication"
                    >
                      ×
                    </button>
                  </div>

                  <div className="med-details">
                    {med.frequency}
                    {med.notes && ` • ${med.notes}`}
                    {med.trackOnly && <span className="track-only-badge"> 📋</span>}
                  </div>

                  {/* Multiple Dose Checkboxes - only show if NOT track-only */}
                  {!med.trackOnly && (
                    <div className="med-doses">
                      {doseTimes.map((doseTime) => (
                        <label key={doseTime} className="dose-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isDoseTaken(med, doseTime)}
                            onChange={() => toggleDose(med._id, doseTime)}
                            className="dose-checkbox"
                          />
                          <span className="dose-time">
                            {doseTime}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedCard;