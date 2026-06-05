/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, Check, Trash2, ShieldAlert, Sparkles, UserMinus, 
  Clock, RotateCw, Play, CheckCircle2, AlertOctagon, HelpCircle 
} from 'lucide-react';
import { StaffAlert, Bed, Patient } from '../types';

interface DischargeAlertsProps {
  alerts: StaffAlert[];
  beds: Bed[];
  patients: Patient[];
  onResolveAlert: (alertId: string) => void;
  onDischargePatient: (patientId: string) => void;
  onCheckDischargeSchedules: () => void;
  onAddActivityLog: (event: string, category: 'bed' | 'patient' | 'blood' | 'system', details: string) => void;
}

export default function DischargeAlerts({
  alerts,
  beds,
  patients,
  onResolveAlert,
  onDischargePatient,
  onCheckDischargeSchedules,
  onAddActivityLog
}: DischargeAlertsProps) {
  
  const [runningSimulation, setRunningSimulation] = useState(false);
  
  // Find auxiliary records to display more details about the alert
  const getAlertBed = (alert: StaffAlert): Bed | null => {
    if (alert.bedId) return beds.find(b => b.id === alert.bedId) || null;
    if (alert.patientId) {
      const p = patients.find(pat => pat.id === alert.patientId);
      if (p && p.assignedBedId) return beds.find(b => b.id === p.assignedBedId) || null;
    }
    return null;
  };

  const getAlertPatient = (alert: StaffAlert): Patient | null => {
    if (alert.patientId) return patients.find(p => p.id === alert.patientId) || null;
    return null;
  };

  const handleRunSystemCheck = () => {
    setRunningSimulation(true);
    setTimeout(() => {
      onCheckDischargeSchedules();
      setRunningSimulation(false);
      onAddActivityLog('Manual Discharge Check Run', 'system', 'Staff manually accelerated automated discharge rules check.');
    }, 600);
  };

  const getAlertSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div id="alerts-board-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* List / Management Panel */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Controls Action Header */}
        <div className="geometric-card p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Automated Alert Registry</h2>
            <p className="text-xs text-slate-500">Live clinical warnings for blood product supply limits and patient discharges.</p>
          </div>

          <button
            onClick={handleRunSystemCheck}
            disabled={runningSimulation}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${runningSimulation ? 'animate-spin' : ''}`} />
            Run Cron Simulation Check
          </button>
        </div>

        {/* Active Alerts Feed */}
        {activeAlerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-slate-700 font-bold">No Urgent Outstanding Alerts</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All automated client-side scheduler rules are verified. Patient discharge expectations are up to date.
            </p>
          </div>
        ) : (
          <div id="alerts-stack" className="space-y-3">
            {activeAlerts.map((alert) => {
              const bed = getAlertBed(alert);
              const patient = getAlertPatient(alert);

              return (
                <div 
                  key={alert.id}
                  id={`alert-card-${alert.id}`}
                  className={`border rounded-lg p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4 transition-all hover:shadow-xs relative overflow-hidden ${getAlertSeverityClass(alert.severity)}`}
                >
                  {/* Left accent bar on card */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                    alert.severity === 'critical' ? 'bg-rose-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />

                  {/* Core Content */}
                  <div className="flex items-start gap-3 pl-2">
                    <div className="p-2 shrink-0 rounded-lg bg-white/80 shadow-xs mt-0.5">
                      {alert.type === 'discharge' ? (
                        <UserMinus className={`w-5 h-5 ${alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                        {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ID: {alert.id}
                      </span>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{alert.message}</p>
                      
                      {/* Enriched patient info if matching */}
                      {alert.type === 'discharge' && patient && bed && (
                        <div className="bg-white/50 p-3 rounded-md border border-black/5 text-xs text-slate-600 space-y-1 mt-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div><strong>Patient:</strong> {patient.name} ({patient.age}y / {patient.gender})</div>
                            <div><strong>Bed/Room:</strong> {bed.roomNumber} ({bed.id})</div>
                            <div><strong>Admission:</strong> {patient.admissionDate}</div>
                            <div><strong>Target Discharge:</strong> <b className="text-amber-700">{patient.expectedDischargeDate}</b></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Action Panel */}
                  <div className="flex sm:flex-row md:flex-col items-center justify-end gap-2 shrink-0 md:self-center pl-10 md:pl-0">
                    {alert.type === 'discharge' && patient ? (
                      <button
                        onClick={() => {
                          if (confirm(`Acknowledge medical checkout? Discharging ${patient.name} will set Bed status to 'Cleaning' to trigger terminal sanitation protocols.`)) {
                            onDischargePatient(patient.id);
                            onResolveAlert(alert.id);
                          }
                        }}
                        className="w-full md:w-auto px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" /> Discharge Patient
                      </button>
                    ) : null}

                    <button
                      onClick={() => {
                        onResolveAlert(alert.id);
                        onAddActivityLog('Alert Dismissed', 'system', `Staff resolved/dismissed alert bulletin: ${alert.id}`);
                      }}
                      className="w-full md:w-auto px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Acknowledge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolved alerts historic summary roll */}
        {resolvedAlerts.length > 0 && (
          <div className="geometric-card p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Resolved Alert Log (Current Session)</h3>
            <div id="resolved-list" className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {resolvedAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate max-w-sm md:max-w-md">{alert.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">RESOLVED</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simulator sidebar controls */}
      <div className="space-y-6">
        <div className="geometric-card p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Auto-Alert Engine</h3>
          </div>

          <div className="text-xs text-slate-500 space-y-3 leading-relaxed">
            <p>
              In a clinical hospital environment, checking discharge discharge compliance schedules depends on automated background criteria.
            </p>
            <div className="bg-slate-50/85 p-3 rounded-md border border-slate-200 space-y-1">
              <strong className="text-slate-700 block">How it works:</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Beds have target discharge dates based on care pathways.</li>
                <li>Scheduler validates date constraints periodically.</li>
                <li>Overdue beds generate high-severity alerts for priority cleaning.</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <b className="text-xs font-bold text-slate-700 block">Trigger Testing Tools:</b>
            
            <div className="space-y-2">
              {/* Button to simulate setting a patient target discharge threshold to today to check automation */}
              <button
                onClick={() => {
                  // Grab David Kim (or any active patient with standard date) and configure their expected date to today
                  const dKim = patients.find(p => p.id === 'PAT-005');
                  if (dKim && dKim.assignedBedId) {
                    // Update David Kim's expected date to today
                    const todayStr = new Date().toISOString().split('T')[0];
                    dKim.expectedDischargeDate = todayStr;
                    onCheckDischargeSchedules();
                    onAddActivityLog('Simulation Accelerated', 'patient', `Accelerated discharge target date for ${dKim.name} to today (${todayStr}) to trigger alert.`);
                    alert(`Simulated: Patient David Kim's expected discharge date set to TODAY (${todayStr}). Run system check or press check scheduled beds!`);
                  } else {
                    alert('Please ensure David Kim is still admitted to test.');
                  }
                }}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-md transition-all cursor-pointer text-left px-3 block font-mono"
              >
                ⚡ Set David Kim discharge date to TODAY
              </button>

              <button
                onClick={() => {
                  // Grab Sophie Dubois and set date to yesterday
                  const sd = patients.find(p => p.id === 'PAT-007');
                  if (sd && sd.assignedBedId) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yestStr = yesterday.toISOString().split('T')[0];
                    sd.expectedDischargeDate = yestStr;
                    onCheckDischargeSchedules();
                    onAddActivityLog('Simulation Accelerated', 'patient', `Set ${sd.name} discharge expectation to yesterday (${yestStr})`);
                    alert(`Simulated: Sophie Dubois' expected discharge date set to YESTERDAY (${yestStr}). This automatically triggers a high-severity alert.`);
                  } else {
                    alert('Please ensure Sophie Dubois is admitted.');
                  }
                }}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-md transition-all cursor-pointer text-left px-3 block font-mono"
              >
                ⚠️ Set Sophie Dubois discharge to OVERDUE (Yesterday)
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400">
              *Testing rules adjust local storage variables, validating live UI reactivity instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
