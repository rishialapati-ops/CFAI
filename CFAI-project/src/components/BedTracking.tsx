/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, Filter, Plus, ShieldAlert, Sparkles, Check, 
  Trash2, UserPlus, FileText, CheckCircle2, RotateCw, Calendar, 
  AlertTriangle, BedDouble, HelpCircle, HeartHandshake, UserX
} from 'lucide-react';
import { Bed, Patient, BedType, BedStatus, PatientCondition, BloodGroup } from '../types';

interface BedTrackingProps {
  beds: Bed[];
  patients: Patient[];
  onAdmitPatient: (bedId: string, patientData: Omit<Patient, 'id' | 'assignedBedId'>) => void;
  onDischargePatient: (patientId: string) => void;
  onUpdateBedStatus: (bedId: string, status: BedStatus) => void;
  onAddActivityLog: (event: string, category: 'bed' | 'patient' | 'blood' | 'system', details: string) => void;
}

export default function BedTracking({
  beds,
  patients,
  onAdmitPatient,
  onDischargePatient,
  onUpdateBedStatus,
  onAddActivityLog
}: BedTrackingProps) {
  // Filters State
  const [selectedWing, setSelectedWing] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeBedDetail, setActiveBedDetail] = useState<string | null>(null);
  const [showAdmitModal, setShowAdmitModal] = useState<string | null>(null); // BedId for admission
  
  // Admission Form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'O+' as BloodGroup,
    admissionReason: '',
    condition: 'Stable' as PatientCondition,
    expectedDischargeDays: '5'
  });

  const wings = ['All', 'North Wing', 'South Wing', 'Emergency Wing', 'East Wing', 'West Wing'];
  const bedTypes = ['All', 'ICU', 'General Ward', 'Emergency', 'Pediatrics', 'Maternity'];
  const bedStatuses = ['All', 'Available', 'Occupied', 'Cleaning', 'Reserved'];

  // Filter beds
  const filteredBeds = beds.filter((bed) => {
    const matchesWing = selectedWing === 'All' || bed.wing === selectedWing;
    const matchesType = selectedType === 'All' || bed.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || bed.status === selectedStatus;
    
    // Search matching (by bed ID, room number, or patient name)
    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const bedMatch = bed.id.toLowerCase().includes(query) || bed.roomNumber.toLowerCase().includes(query);
      
      let pMatch = false;
      if (bed.currentPatientId) {
        const p = patients.find(patient => patient.id === bed.currentPatientId);
        if (p) {
          pMatch = p.name.toLowerCase().includes(query) || p.admissionReason.toLowerCase().includes(query);
        }
      }
      matchesSearch = bedMatch || pMatch;
    }

    return matchesWing && matchesType && matchesStatus && matchesSearch;
  });

  // Calculate status tags classes
  const getStatusBadgeClass = (status: BedStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Occupied':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Cleaning':
        return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse-subtle';
      case 'Reserved':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getConditionColor = (cond: PatientCondition) => {
    switch (cond) {
      case 'Stable': return 'text-emerald-600 bg-emerald-50';
      case 'Guarded': return 'text-sky-600 bg-sky-50';
      case 'Severe': return 'text-amber-600 bg-amber-50';
      case 'Critical': return 'text-rose-600 bg-rose-50 animate-pulse-subtle border border-rose-200';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdmitModal) return;
    
    if (!newPatient.name.trim() || !newPatient.admissionReason.trim()) {
      alert('Please fill out all patient validation fields.');
      return;
    }

    // Calculate dates
    const today = new Date();
    const admissionDate = today.toISOString().split('T')[0];
    
    const dischargeDateObj = new Date();
    dischargeDateObj.setDate(today.getDate() + parseInt(newPatient.expectedDischargeDays || '5'));
    const expectedDischargeDate = dischargeDateObj.toISOString().split('T')[0];

    onAdmitPatient(showAdmitModal, {
      name: newPatient.name,
      age: parseInt(newPatient.age) || 35,
      gender: newPatient.gender,
      bloodGroup: newPatient.bloodGroup,
      admissionReason: newPatient.admissionReason,
      condition: newPatient.condition,
      admissionDate,
      expectedDischargeDate
    });

    // Reset admission form
    setNewPatient({
      name: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      admissionReason: '',
      condition: 'Stable',
      expectedDischargeDays: '5'
    });
    
    setShowAdmitModal(null);
  };

  // Find patient for a specific bed
  const getPatientForBed = (bed: Bed) => {
    if (!bed.currentPatientId) return null;
    return patients.find(p => p.id === bed.currentPatientId) || null;
  };

  return (
    <div id="bed-tracking-container" className="space-y-6">
      {/* Header Panel with search and filters */}
      <div className="geometric-card p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Real-Time Bed Monitoring Grid</h2>
            <p className="text-xs text-slate-500">Track and manage emergency care admissions, specialized wards, and clean cycles.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              {beds.filter(b => b.status === 'Available').length} Ready
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-800 rounded-md border border-rose-100">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
              {beds.filter(b => b.status === 'Occupied').length} Occupied
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
              {beds.filter(b => b.status === 'Cleaning').length} Sanitizing
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="bed-search"
              type="text"
              placeholder="Search Room, Bed ID, Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Wing Select */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              id="wing-filter"
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-hidden text-slate-700"
            >
              {wings.map(wing => (
                <option key={wing} value={wing}>{wing === 'All' ? 'All Hospital Wings' : wing}</option>
              ))}
            </select>
          </div>

          {/* Bed Type Select */}
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-hidden text-slate-700"
          >
            {bedTypes.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'All Care Levels' : `${type} Wards`}</option>
            ))}
          </select>

          {/* Bed Status Select */}
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-hidden text-slate-700"
          >
            {bedStatuses.map(status => (
              <option key={status} value={status}>{status === 'All' ? 'All Live Statuses' : `Status: ${status}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bed Grid Display */}
      {filteredBeds.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No matching hospital beds found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search metrics or filters to locate beds.</p>
        </div>
      ) : (
        <div id="beds-grid-layout" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const currentPatient = getPatientForBed(bed);
            
            return (
              <div 
                key={bed.id}
                id={`bed-card-${bed.id}`}
                className={`bg-white rounded-lg border border-slate-200 transition-all duration-300 hover:shadow-xs flex flex-col justify-between ${
                  activeBedDetail === bed.id ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''
                }`}
              >
                {/* Visual indicator header */}
                <div className="p-4 pb-3 flex items-start justify-between border-b border-slate-50">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{bed.wing}</span>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      {bed.roomNumber}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(bed.status)}`}>
                    {bed.status}
                  </span>
                </div>

                {/* Patient / Bed Info Body */}
                <div className="p-4 pt-3 flex-1">
                  {bed.status === 'Occupied' && currentPatient ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Assigned Patient:</span>
                        <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded-sm uppercase ${getConditionColor(currentPatient.condition)}`}>
                          {currentPatient.condition}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-700">{currentPatient.name}</div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div><strong className="text-slate-600">ID:</strong> {currentPatient.id} ({currentPatient.age}y / {currentPatient.gender})</div>
                        <div className="truncate"><strong className="text-slate-600">Diagnosis:</strong> {currentPatient.admissionReason}</div>
                        <div className="flex items-center gap-1 mt-1 text-slate-600">
                          <span className="inline-block px-1 bg-red-50 text-red-700 font-semibold rounded text-[10px]">{currentPatient.bloodGroup}</span>
                          <span>• Discharge expected: {currentPatient.expectedDischargeDate}</span>
                        </div>
                      </div>
                    </div>
                  ) : bed.status === 'Cleaning' ? (
                    <div className="h-full flex flex-col justify-center py-4 text-center space-y-1 text-xs text-slate-500">
                      <div className="mx-auto p-2 bg-amber-50 text-amber-600 rounded-full w-8 h-8 flex items-center justify-center animate-spin">
                        <RotateCw className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-amber-700">Awaiting Sanitation</span>
                      <span>Required terminal disinfection before reuse</span>
                    </div>
                  ) : bed.status === 'Reserved' ? (
                    <div className="h-full flex flex-col justify-center py-4 text-center space-y-1 text-xs text-slate-500">
                      <div className="mx-auto p-2 bg-purple-50 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-purple-700">Emergency Hold</span>
                      <span>Reserved for incoming or surgery patient</span>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center py-4 text-center space-y-1 text-xs text-slate-400">
                      <span className="font-semibold text-emerald-600">Ready for Patient admission</span>
                      <span>Care type: {bed.type} ward</span>
                    </div>
                  )}
                </div>

                {/* Operations Footer Action bar */}
                <div className="p-3 bg-slate-50 rounded-b-lg border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[11px] font-mono font-medium text-slate-500">{bed.id}</div>
                  
                  <div className="flex items-center gap-1">
                    {bed.status === 'Available' && (
                      <>
                        <button
                          onClick={() => setShowAdmitModal(bed.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <UserPlus className="w-3" /> Admit
                        </button>
                        <button
                          onClick={() => {
                            onUpdateBedStatus(bed.id, 'Reserved');
                            onAddActivityLog('Bed Reserved', 'bed', `${bed.id} (${bed.roomNumber}) placed on operational hold`);
                          }}
                          className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Hold
                        </button>
                      </>
                    )}

                    {bed.status === 'Occupied' && currentPatient && (
                      <button
                        onClick={() => {
                          if (confirm(`Confirm clinical discharge workflow for patient: ${currentPatient.name}?`)) {
                            onDischargePatient(currentPatient.id);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <UserX className="w-3" /> Discharge
                      </button>
                    )}

                    {bed.status === 'Cleaning' && (
                      <button
                        onClick={() => {
                          onUpdateBedStatus(bed.id, 'Available');
                          onAddActivityLog('Sanitation Cleared', 'bed', `${bed.roomNumber} marked sterilized and available`);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3" /> Clear Bed
                      </button>
                    )}

                    {bed.status === 'Reserved' && (
                      <>
                        <button
                          onClick={() => setShowAdmitModal(bed.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <UserPlus className="w-3" /> Admit
                        </button>
                        <button
                          onClick={() => {
                            onUpdateBedStatus(bed.id, 'Available');
                            onAddActivityLog('Reservation Cancelled', 'bed', `Emergency hold removed on ${bed.roomNumber}`);
                          }}
                          className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Release
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admission Modal Form */}
      {showAdmitModal && (
        <div id="admission-modal" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">New Clinical Patient Admission</h3>
                <span className="text-xs text-slate-500">Allocating to {beds.find(b => b.id === showAdmitModal)?.roomNumber} ({beds.find(b => b.id === showAdmitModal)?.type} Bed)</span>
              </div>
              <button 
                onClick={() => setShowAdmitModal(null)}
                className="p-1 px-2 hover:bg-slate-200 rounded-lg text-slate-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdmissionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Patient Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter patient full legal name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Patient Age */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Age (years) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 42"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({...newPatient, gender: e.target.value as 'Male' | 'Female' | 'Other'})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Blood Group *</label>
                  <select
                    value={newPatient.bloodGroup}
                    onChange={(e) => setNewPatient({...newPatient, bloodGroup: e.target.value as BloodGroup})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                  </select>
                </div>

                {/* Condition */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Initial Condition *</label>
                  <select
                    value={newPatient.condition}
                    onChange={(e) => setNewPatient({...newPatient, condition: e.target.value as PatientCondition})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="Stable">Stable (Sub-acute)</option>
                    <option value="Guarded">Guarded (Under Observation)</option>
                    <option value="Severe">Severe (Urgent Care)</option>
                    <option value="Critical">Critical (Immediate Intensive Intervention)</option>
                  </select>
                </div>

                {/* Admission Reason */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Diagnosis / Reason for Admission *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="State primary clinical concern or surgery treatment"
                    value={newPatient.admissionReason}
                    onChange={(e) => setNewPatient({...newPatient, admissionReason: e.target.value})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Scheduled Days */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Expected Hold Duration (Days)</label>
                  <select
                    value={newPatient.expectedDischargeDays}
                    onChange={(e) => setNewPatient({...newPatient, expectedDischargeDays: e.target.value})}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="1">1 Day (Observations / Day-Surgery)</option>
                    <option value="3">3 Days (Surgical post-op recovery)</option>
                    <option value="5">5 Days (Standard General ward monitoring)</option>
                    <option value="7">7 Days (Severe case stability observation)</option>
                    <option value="14">14 Days (Extended Treatment / Intensive Rehab)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Calculates auto-alerts triggered on target scheduled date to prompt staff for bedside evaluation.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(null)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finalize Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
