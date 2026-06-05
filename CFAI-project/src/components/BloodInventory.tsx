/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Droplet, Plus, Minus, Heart, ShieldAlert, CheckCircle, 
  ChevronRight, Calendar, BarChart2, Activity, Database, AlertCircle 
} from 'lucide-react';
import { BloodStock, BloodGroup, Patient } from '../types';

interface BloodInventoryProps {
  bloodStock: BloodStock[];
  patients: Patient[];
  onUpdateStock: (bloodGroup: BloodGroup, units: number) => void;
  onAddActivityLog: (event: string, category: 'bed' | 'patient' | 'blood' | 'system', details: string) => void;
}

export default function BloodInventory({
  bloodStock,
  patients,
  onUpdateStock,
  onAddActivityLog
}: BloodInventoryProps) {
  // Donation Form States
  const [donorName, setDonorName] = useState('');
  const [donorGroup, setDonorGroup] = useState<BloodGroup>('O+');
  const [donationUnits, setDonationUnits] = useState('1');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);

  // Dispense Form States
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dispenseUnits, setDispenseUnits] = useState('1');
  const [dispenseGroup, setDispenseGroup] = useState<BloodGroup>('O+');

  // Interactive Stock Adjustment values (+1/-1 directly on card)
  const handleStockAdjust = (bloodGroup: BloodGroup, delta: number) => {
    const current = bloodStock.find(b => b.bloodGroup === bloodGroup);
    if (!current) return;
    const nextUnits = Math.max(0, current.units + delta);
    onUpdateStock(bloodGroup, nextUnits);
    
    // Log change
    const action = delta > 0 ? 'Stock Increased' : 'Stock Issued';
    onAddActivityLog(
      `Blood Bank Update`,
      'blood',
      `Manual stock count adjusted for ${bloodGroup}: ${current.units} -> ${nextUnits} units`
    );
  };

  // Submit Blood Donation
  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert('Please fill out donor legal name.');
      return;
    }
    const unitsNum = parseInt(donationUnits);
    if (isNaN(unitsNum) || unitsNum <= 0) {
      alert('Units must be greater than zero.');
      return;
    }

    const currentStock = bloodStock.find(b => b.bloodGroup === donorGroup);
    const initialUnits = currentStock ? currentStock.units : 0;
    const finalUnits = initialUnits + unitsNum;
    
    onUpdateStock(donorGroup, finalUnits);
    onAddActivityLog(
      'Blood Donation Registered',
      'blood',
      `Donor ${donorName} contributed ${unitsNum} units of ${donorGroup} blood.`
    );

    // Reset Form
    setDonorName('');
    setDonationUnits('1');
    alert(`Thank you! Successfully registered ${unitsNum} units of ${donorGroup} from ${donorName}.`);
  };

  // Dispense Blood to Patient
  const handleDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a recipient patient.');
      return;
    }
    const unitsNum = parseInt(dispenseUnits);
    if (isNaN(unitsNum) || unitsNum <= 0) {
      alert('Units must be greater than zero.');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const currentStock = bloodStock.find(b => b.bloodGroup === dispenseGroup);
    if (!currentStock || currentStock.units < unitsNum) {
      alert(`Insufficient blood stock! Only ${currentStock?.units || 0} units of ${dispenseGroup} available, but ${unitsNum} were requested.`);
      return;
    }

    // Compatibility warnings simple rule checks
    const promptCompatibilityCheck = checkCompatibility(dispenseGroup, patient.bloodGroup);
    if (!promptCompatibilityCheck) {
      const confirmProceed = confirm(
        `CRITICAL CLINICAL ADVISORY:\n` +
        `Selected blood type (${dispenseGroup}) is NOT compatible with the patient's blood group (${patient.bloodGroup}).\n\n` +
        `Do you have override medical authority to finalize this transfusion?`
      );
      if (!confirmProceed) return;
    }

    const finalUnits = currentStock.units - unitsNum;
    onUpdateStock(dispenseGroup, finalUnits);
    onAddActivityLog(
      'Blood Unit Dispensed',
      'blood',
      `Issued ${unitsNum} units of ${dispenseGroup} to Patient ${patient.name} (${patient.id}, Blood Group: ${patient.bloodGroup})`
    );

    alert(`Successfully issued ${unitsNum} units of ${dispenseGroup} for ${patient.name}.`);
    setSelectedPatientId('');
    setDispenseUnits('1');
  };

  // Simple compatibility rule set finder (returns compatibility status)
  // Donor blood -> Recipient blood
  const checkCompatibility = (donor: BloodGroup, recipient: BloodGroup): boolean => {
    if (donor === 'O-') return true; // Universal donor
    if (recipient === 'AB+') return true; // Universal recipient
    
    // Direct matches
    if (donor === recipient) return true;
    
    // Breakdowns
    if (donor === 'O+' && ['O+', 'A+', 'B+', 'AB+'].includes(recipient)) return true;
    if (donor === 'A-' && ['A-', 'A+', 'AB-', 'AB+'].includes(recipient)) return true;
    if (donor === 'A+' && ['A+', 'AB+'].includes(recipient)) return true;
    if (donor === 'B-' && ['B-', 'B+', 'AB-', 'AB+'].includes(recipient)) return true;
    if (donor === 'B+' && ['B+', 'AB+'].includes(recipient)) return true;
    if (donor === 'AB-' && ['AB-', 'AB+'].includes(recipient)) return true;
    
    return false;
  };

  return (
    <div id="blood-inventory-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 2/3 Width Side: High fidelity grid display list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="geometric-card p-5 border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Critical Blood Bank Status</h2>
              <p className="text-xs text-slate-500">Real-time units monitoring with automatic threshold safety limits.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-md">
              <Activity className="w-4 h-4 animate-pulse" /> Live Telemetry
            </div>
          </div>

          {/* Liquid Glass Blood Indicator Cards */}
          <div id="blood-indicators-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bloodStock.map((stock) => {
              const isBelowThreshold = stock.units < stock.minThreshold;
              const fillPercentage = Math.min(100, Math.round((stock.units / Math.max(1, stock.minThreshold * 2.5)) * 100));
              
              return (
                <div 
                  key={stock.bloodGroup}
                  id={`blood-card-${stock.bloodGroup.replace('+', 'pos').replace('-', 'neg')}`}
                  className={`bg-slate-50 rounded-lg border p-4 text-center space-y-3 relative group transition-all hover:shadow-xs hover:bg-white hover:border-slate-200 ${
                    isBelowThreshold ? 'border-rose-200 shadow-rose-50/20' : 'border-slate-200/50'
                  }`}
                >
                  {/* Danger Alert Icon absolute */}
                  {isBelowThreshold && (
                    <span className="absolute top-3 right-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}

                  {/* Blood bag visual icon with filled factor */}
                  <div className="relative mx-auto w-14 h-20 bg-slate-200 border-2 border-slate-300 rounded-b-2xl rounded-t-lg flex items-end overflow-hidden shadow-inner">
                    {/* Hanging ring */}
                    <div className="absolute top-1 left-1.5 right-1.5 h-1 bg-slate-300 rounded-sm" />
                    
                    {/* Filled red volume factor */}
                    <div 
                      className={`w-full rounded-b-2xl transition-all duration-700 ${
                        isBelowThreshold ? 'bg-rose-500' : 'bg-red-600 bg-linear-to-t from-red-700 to-red-500'
                      }`}
                      style={{ height: `${Math.max(12, fillPercentage)}%` }}
                    />
                    
                    {/* Floating Level Label inside container */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center select-none pt-2">
                      <span className="text-xl font-black text-slate-800 drop-shadow-sm mix-blend-color-burn">{stock.bloodGroup}</span>
                      <span className="text-[10px] font-bold text-slate-700">{stock.units} Units</span>
                    </div>
                  </div>

                  {/* Threshold Safety labels */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                      <span>Min Safe:</span>
                      <span className="font-bold text-slate-600">{stock.minThreshold} U</span>
                    </div>
                    {isBelowThreshold ? (
                      <span className="inline-block text-[10px] py-0.5 px-2 bg-rose-50 text-rose-700 font-bold border border-rose-100 rounded-full animate-bounce">
                        CRITICAL STOCK
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] py-0.5 px-2 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 rounded-full">
                        OPTIMAL
                      </span>
                    )}
                  </div>

                  {/* Core Add/Subtract Stepper Controls */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleStockAdjust(stock.bloodGroup, -1)}
                      disabled={stock.units <= 0}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-20"
                      title="Issue 1 Unit"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-400">Adjust</span>
                    <button
                      type="button"
                      onClick={() => handleStockAdjust(stock.bloodGroup, 1)}
                      className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Add 1 Unit"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Compability Flowcard */}
        <div className="bg-slate-50/85 p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <Heart className="w-5 h-5 text-red-500" />
            Clinical Transfusion & Compatibility Matrix Reference
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
            <div className="bg-white p-3 rounded-md border border-slate-200/80">
              <strong className="text-slate-800 block mb-1">Type O- (Universal Donor)</strong>
              Can give red blood cells to anyone of any blood group. Highly valued in trauma emergencies where there is no time to test group.
            </div>
            <div className="bg-white p-3 rounded-md border border-slate-200/80">
              <strong className="text-slate-800 block mb-1">Type AB+ (Universal Recipient)</strong>
              Can receive blood products safely from any blood group. Red-cell transfusions carry zero immune risk.
            </div>
          </div>
        </div>
      </div>

      {/* 1/3 Width Side: Forms for donation count and dispense issuing */}
      <div className="space-y-6">
        
        {/* Donation Intake Register Form */}
        <div className="geometric-card p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">New Donor Intake Portal</h3>
          </div>
          
          <form onSubmit={handleDonationSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Donor Legal Full Name</label>
              <input
                type="text"
                placeholder="e.g. Johnathan Doe"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Blood Group</label>
                <select
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value as BloodGroup)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-emerald-500 transition-colors"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Donation Units</label>
                <select
                  value={donationUnits}
                  onChange={(e) => setDonationUnits(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-emerald-500 transition-colors"
                >
                  <option value="1">1 Unit (Standard)</option>
                  <option value="2">2 Units (Double Red)</option>
                  <option value="3">3 Units</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register Donor Contribution
            </button>
          </form>
        </div>

        {/* Blood Issuing Dispense Form for Active Admitted Patients */}
        <div className="geometric-card p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Issue Blood Product</h3>
          </div>

          {patients.filter(p => p.assignedBedId !== null).length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">
              No active admitted patients available to dispense blood products.
            </div>
          ) : (
            <form onSubmit={handleDispenseSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Recipient Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    const p = patients.find(patient => patient.id === e.target.value);
                    if (p) {
                      setDispenseGroup(p.bloodGroup); // Auto-suggest matching blood
                    }
                  }}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-rose-500 transition-colors text-slate-700"
                  required
                >
                  <option value="">Select Hospitalized Patient...</option>
                  {patients.filter(p => p.assignedBedId !== null).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id} - Blood Group: {p.bloodGroup} / {p.condition})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatientId && (
                <div className="text-[11px] text-slate-400 py-1 px-2.5 bg-slate-50 rounded-md border border-slate-150">
                  Patient base type is <b className="text-rose-600">{patients.find(p => p.id === selectedPatientId)?.bloodGroup}</b>.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Dispense Blood Type</label>
                  <select
                    value={dispenseGroup}
                    onChange={(e) => setDispenseGroup(e.target.value as BloodGroup)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-rose-500 transition-colors"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Units Count</label>
                  <select
                    value={dispenseUnits}
                    onChange={(e) => setDispenseUnits(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-hidden focus:border-rose-500 transition-colors"
                  >
                    <option value="1">1 Unit</option>
                    <option value="2">2 Units</option>
                    <option value="3">3 Units</option>
                    <option value="4">4 Units</option>
                  </select>
                </div>
              </div>

              {selectedPatientId && (
                <div className="pt-1">
                  {checkCompatibility(dispenseGroup, patients.find(p => p.id === selectedPatientId)?.bloodGroup || 'O+') ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <CheckCircle className="w-4 h-4" /> Compatible Transfusion Choice
                    </div>
                  ) : (
                    <div className="flex items-start gap-1 text-xs text-rose-500 font-semibold bg-rose-50 p-2 rounded-md border border-rose-100">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Incompatible choice. Immunoreaction Risk! Override confirmation will be triggered on submit.</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Dispense Blood Product
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
