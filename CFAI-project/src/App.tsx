/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  BedDouble, 
  Droplet, 
  Bell, 
  ClipboardList, 
  User, 
  Clock, 
  RotateCw, 
  ShieldAlert, 
  Trash2,
  CalendarDays,
  HeartPulse,
  UserCheck2,
  CheckSquare
} from 'lucide-react';

import { Bed, Patient, BloodStock, StaffAlert, ActivityLog, BloodGroup, BedStatus } from './types';
import { INITIAL_BEDS, INITIAL_PATIENTS, INITIAL_BLOOD_STOCK, INITIAL_ALERTS, INITIAL_LOGS } from './data/mockData';

// Component imports
import DashboardStats from './components/DashboardStats';
import BedTracking from './components/BedTracking';
import BloodInventory from './components/BloodInventory';
import DischargeAlerts from './components/DischargeAlerts';

export default function App() {
  // --- STATE ---
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bloodStock, setBloodStock] = useState<BloodStock[]>([]);
  const [alerts, setAlerts] = useState<StaffAlert[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<string>('beds');
  const [currentTime, setCurrentTime] = useState<string>('2026-06-05 04:07:35'); // Centered on metadata

  // --- INITIAL LOAD & PERSISTENCE ---
  useEffect(() => {
    // Beds
    const savedBeds = localStorage.getItem('hospital_beds');
    if (savedBeds) {
      setBeds(JSON.parse(savedBeds));
    } else {
      setBeds(INITIAL_BEDS);
      localStorage.setItem('hospital_beds', JSON.stringify(INITIAL_BEDS));
    }

    // Patients
    const savedPatients = localStorage.getItem('hospital_patients');
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    } else {
      setPatients(INITIAL_PATIENTS);
      localStorage.setItem('hospital_patients', JSON.stringify(INITIAL_PATIENTS));
    }

    // Blood
    const savedBlood = localStorage.getItem('hospital_blood');
    if (savedBlood) {
      setBloodStock(JSON.parse(savedBlood));
    } else {
      setBloodStock(INITIAL_BLOOD_STOCK);
      localStorage.setItem('hospital_blood', JSON.stringify(INITIAL_BLOOD_STOCK));
    }

    // Alerts
    const savedAlerts = localStorage.getItem('hospital_alerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    } else {
      setAlerts(INITIAL_ALERTS);
      localStorage.setItem('hospital_alerts', JSON.stringify(INITIAL_ALERTS));
    }

    // Logs
    const savedLogs = localStorage.getItem('hospital_logs');
    if (savedLogs) {
      setActivityLogs(JSON.parse(savedLogs));
    } else {
      setActivityLogs(INITIAL_LOGS);
      localStorage.setItem('hospital_logs', JSON.stringify(INITIAL_LOGS));
    }
  }, []);

  // Update clock simulating ticking slowly
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Format to matching user session date: 2026-06-05
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentTime(`2026-06-05 ${timeString}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper helper to write to local storage
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- LOGGING ENGINE ---
  const addActivityLog = (event: string, category: 'bed' | 'patient' | 'blood' | 'system', details: string) => {
    const newLog: ActivityLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      event,
      category,
      details
    };
    setActivityLogs((prev) => {
      const next = [newLog, ...prev].slice(0, 50); // Keep last 50
      saveState('hospital_logs', next);
      return next;
    });
  };

  // --- SYSTEM ACTION: ADMIT NEW PATIENT ---
  const handleAdmitPatient = (bedId: string, patientData: Omit<Patient, 'id' | 'assignedBedId'>) => {
    const newId = `PAT-${Math.floor(100 + Math.random() * 900)}`;
    const freshPatient: Patient = {
      ...patientData,
      id: newId,
      assignedBedId: bedId
    };

    // Update patients database
    const nextPatients = [freshPatient, ...patients];
    setPatients(nextPatients);
    saveState('hospital_patients', nextPatients);

    // Update bed status in array
    const nextBeds = beds.map((b) => {
      if (b.id === bedId) {
        return { ...b, status: 'Occupied' as BedStatus, currentPatientId: newId };
      }
      return b;
    });
    setBeds(nextBeds);
    saveState('hospital_beds', nextBeds);

    addActivityLog(
      'Patient Admitted',
      'patient',
      `Admitted ${patientData.name} to Bed ${bedId}. Care pathway scheduled discharge: ${patientData.expectedDischargeDate}.`
    );

    // Check schedules immediately to see if we should flag alert (just in case)
    setTimeout(() => {
      evaluateDischargeSchedules(nextPatients, nextBeds);
    }, 500);
  };

  // --- SYSTEM ACTION: DISCHARGE PATIENT ---
  const handleDischargePatient = (patientId: string) => {
    const patientObj = patients.find((p) => p.id === patientId);
    if (!patientObj) return;

    const assignedBedId = patientObj.assignedBedId;

    // Disassociate patient from bed
    const nextPatients = patients.map((p) => {
      if (p.id === patientId) {
        return { ...p, assignedBedId: null };
      }
      return p;
    });
    setPatients(nextPatients);
    saveState('hospital_patients', nextPatients);

    // Bed moves to CLEANING cycle
    let bedLabel = 'N/A';
    const nextBeds = beds.map((b) => {
      if (b.id === assignedBedId) {
        bedLabel = b.roomNumber;
        return { ...b, status: 'Cleaning' as BedStatus, currentPatientId: null };
      }
      return b;
    });
    setBeds(nextBeds);
    saveState('hospital_beds', nextBeds);

    // Automatically resolve corresponding alarms for this patient/bed
    const nextAlerts = alerts.map((a) => {
      if (a.patientId === patientId || a.bedId === assignedBedId) {
        return { ...a, resolved: true };
      }
      return a;
    });
    setAlerts(nextAlerts);
    saveState('hospital_alerts', nextAlerts);

    addActivityLog(
      'Patient Discharged',
      'patient',
      `Discharged ${patientObj.name} from ${bedLabel}. Bed assigned to mandatory disinfection queue.`
    );
  };

  // --- SYSTEM ACTION: UPDATE BED STATUS (e.g. cleaning completion) ---
  const handleUpdateBedStatus = (bedId: string, status: BedStatus) => {
    const nextBeds = beds.map((b) => {
      if (b.id === bedId) {
        return { ...b, status };
      }
      return b;
    });
    setBeds(nextBeds);
    saveState('hospital_beds', nextBeds);
    
    addActivityLog(
      'Bed Status Updated',
      'bed',
      `Bed ${bedId} manually reassigned status: '${status}'`
    );
  };

  // --- SYSTEM ACTION: BLOOD STOCK UPDATE ---
  const handleUpdateStock = (bloodGroup: BloodGroup, units: number) => {
    const nextBlood = bloodStock.map((b) => {
      if (b.bloodGroup === bloodGroup) {
        return { ...b, units };
      }
      return b;
    });
    setBloodStock(nextBlood);
    saveState('hospital_blood', nextBlood);

    // Automated Low Blood Threshold Watch Check
    const targetGroup = nextBlood.find((b) => b.bloodGroup === bloodGroup);
    if (targetGroup) {
      const isBelow = targetGroup.units < targetGroup.minThreshold;
      
      if (isBelow) {
        // Trigger alert only if none already exists for this blood group
        const alertExists = alerts.some((a) => !a.resolved && a.type === 'low-blood' && a.message.includes(bloodGroup));
        if (!alertExists) {
          const newAlert: StaffAlert = {
            id: `ALERT-${Math.floor(1000 + Math.random() * 9000).toString()}`,
            timestamp: new Date().toISOString(),
            type: 'low-blood',
            message: `Critical stock alert: ${bloodGroup} units have fallen to ${units} (Min threshold: ${targetGroup.minThreshold}).`,
            severity: 'critical',
            resolved: false
          };
          const nextAlerts = [newAlert, ...alerts];
          setAlerts(nextAlerts);
          saveState('hospital_alerts', nextAlerts);
          
          addActivityLog(
            'Blood Stock Alert Triggered',
            'system',
            `Automated alarm registered for critically low reserve of blood group: ${bloodGroup}`
          );
        }
      } else {
        // Automatically resolve alert if units are back to safety threshold
        const nextAlerts = alerts.map((a) => {
          if (!a.resolved && a.type === 'low-blood' && a.message.includes(bloodGroup)) {
            return { ...a, resolved: true };
          }
          return a;
        });
        setAlerts(nextAlerts);
        saveState('hospital_alerts', nextAlerts);
      }
    }
  };

  // --- SYSTEM ACTION: RESOLVE AN ACTIVE ALERT ---
  const handleResolveAlert = (alertId: string) => {
    const nextAlerts = alerts.map((a) => {
      if (a.id === alertId) {
        return { ...a, resolved: true };
      }
      return a;
    });
    setAlerts(nextAlerts);
    saveState('hospital_alerts', nextAlerts);
  };

  // --- AUTOMATED SCHEDULER: DISCHARGE ALERTS GENERATION ---
  const evaluateDischargeSchedules = (currentPatientsList: Patient[], currentBedsList: Bed[]) => {
    const todayStr = '2026-06-05'; // Anchor simulation date
    const today = new Date(todayStr);

    let newAlertsCount = 0;
    const generatedAlerts: StaffAlert[] = [];

    currentPatientsList.forEach((patient) => {
      // Check only hospitalized patients
      if (patient.assignedBedId) {
        const bed = currentBedsList.find((b) => b.id === patient.assignedBedId);
        if (!bed) return;

        const pExpDate = new Date(patient.expectedDischargeDate);
        
        // Is discharge scheduled for today or past due?
        if (patient.expectedDischargeDate <= todayStr) {
          // Check if an unresolved discharge alert already exists for this patient
          const alertExists = alerts.some((a) => !a.resolved && a.patientId === patient.id && a.type === 'discharge');
          
          if (!alertExists) {
            newAlertsCount++;
            const isOverdue = patient.expectedDischargeDate < todayStr;
            
            const freshAlert: StaffAlert = {
              id: `ALERT-SCHED-${Math.floor(100 + Math.random() * 900)}`,
              timestamp: new Date().toISOString(),
              type: 'discharge',
              message: isOverdue 
                ? `Action Required: ${patient.name} (Room ${bed.roomNumber}) is past due for scheduled discharge since ${patient.expectedDischargeDate}.`
                : `Automated Alert: Patient ${patient.name} (Room ${bed.roomNumber}) is scheduled for discharge today.`,
              severity: isOverdue ? 'warning' : 'info',
              resolved: false,
              patientId: patient.id,
              bedId: bed.id
            };
            generatedAlerts.push(freshAlert);
          }
        }
      }
    });

    if (generatedAlerts.length > 0) {
      const nextAlerts = [...generatedAlerts, ...alerts];
      setAlerts(nextAlerts);
      saveState('hospital_alerts', nextAlerts);
      alert(`Automated Scheduler compiled: Created ${newAlertsCount} new discharge alerts for review.`);
    } else {
      alert('Cron Scheduler result: All hospitalized patients correspond to valid treatment schedules.');
    }
  };

  const handleManualCheckDischarges = () => {
    evaluateDischargeSchedules(patients, beds);
  };

  // --- RESET SIMULATED DATABASE ---
  const handleResetDatabase = () => {
    if (confirm('Are you sure you want to restore all hospital beds, patients, and blood stock to demo baseline?')) {
      localStorage.clear();
      setBeds(INITIAL_BEDS);
      setPatients(INITIAL_PATIENTS);
      setBloodStock(INITIAL_BLOOD_STOCK);
      setAlerts(INITIAL_ALERTS);
      setActivityLogs(INITIAL_LOGS);
      
      saveState('hospital_beds', INITIAL_BEDS);
      saveState('hospital_patients', INITIAL_PATIENTS);
      saveState('hospital_blood', INITIAL_BLOOD_STOCK);
      saveState('hospital_alerts', INITIAL_ALERTS);
      saveState('hospital_logs', INITIAL_LOGS);
      
      addActivityLog('System Reset', 'system', 'All configurations, records, and donor transactions reverted to medical default values.');
      alert('Database restore complete!');
    }
  };

  return (
    <div id="hospital-app" className="min-h-screen geometric-dot-bg font-sans flex">
      
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 hidden md:flex border-r border-slate-800">
        <div className="space-y-6">
          
          {/* Logo Brand Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <HeartPulse className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase">St. Jude Medical</h1>
              <span className="text-[10px] text-slate-400 tracking-wider block font-semibold uppercase leading-none">Clinics Hub Suite</span>
            </div>
          </div>

          {/* Active Administrator Shift profile */}
          <div className="px-6 py-2">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs text-white">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  JS
                </div>
                <span className="font-semibold truncate">Anirudh - Shift Coordinator</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1 font-mono">
                <div>Email: jayaanirudh@klh.edu.in</div>
                <div>Role: Medical Staff Admin</div>
              </div>
            </div>
          </div>

          {/* Nav Item Menu links */}
          <nav id="sidebar-nav" className="px-4 space-y-1">
            <button
              onClick={() => setActiveTab('beds')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider ${
                activeTab === 'beds' 
                  ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' 
                  : 'hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <BedDouble className="w-4 h-4" />
                Bed Allocation Grid
              </span>
              <span className="bg-slate-855 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                {beds.filter(b => b.status === 'Available').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('blood')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider ${
                activeTab === 'blood' 
                  ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' 
                  : 'hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Droplet className="w-4 h-4" />
                Blood Reserves
              </span>
              {bloodStock.filter(b => b.units < b.minThreshold).length > 0 && (
                <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[10px] animate-bounce">
                  LOW
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider ${
                activeTab === 'alerts' 
                  ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' 
                  : 'hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                Alerts Registry
              </span>
              {alerts.filter(a => !a.resolved).length > 0 && (
                <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded text-[10px]">
                  {alerts.filter(a => !a.resolved).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider ${
                activeTab === 'logs' 
                  ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' 
                  : 'hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                Shift Audit Log
              </span>
            </button>
          </nav>
        </div>

        {/* System Reset / Simulation control */}
        <div className="p-4 border-t border-slate-850 space-y-2">
          <div className="text-[10px] text-slate-500 text-center font-mono py-1">
            Build Target: v3.2-Release
          </div>
          <button
            onClick={handleResetDatabase}
            className="w-full py-2 bg-slate-850 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-[11px] font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            Reset Application DB
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION PANEL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS HEADER BAR */}
        <header id="top-bar" className="bg-white border-b border-slate-100 py-3.5 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:hidden">
            <HeartPulse className="w-6 h-6 text-blue-600 shrink-0" />
            <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase">St. Jude Medical</h2>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Duty Area:</span>
            <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-full">
              Full Access Ward Coordinator
            </span>
            <span className="text-slate-200">|</span>
            <span className="text-xs text-slate-400">Total Patients Enrolled:</span>
            <span className="text-xs font-bold text-slate-700">{patients.length} (Active)</span>
          </div>

          {/* Simulated Universal Clock */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-3xs">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{currentTime}</span>
              <span className="text-[10px] px-1 bg-blue-100 text-blue-800 font-bold rounded">UTC</span>
            </div>
          </div>
        </header>

        {/* MOBILE VISUAL NAV TAB BUTTONS (ONLY ON MOBILE SCREENS) */}
        <div className="md:hidden bg-slate-900 p-2 text-slate-350 border-b border-slate-850 flex items-center justify-around gap-1">
          <button 
            onClick={() => setActiveTab('beds')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase ${activeTab === 'beds' ? 'bg-blue-600 text-white' : ''}`}
          >
            <BedDouble className="w-4 h-4 mb-0.5" />
            Beds
          </button>
          <button 
            onClick={() => setActiveTab('blood')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase ${activeTab === 'blood' ? 'bg-blue-600 text-white' : ''}`}
          >
            <Droplet className="w-4 h-4 mb-0.5" />
            Blood
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase ${activeTab === 'alerts' ? 'bg-blue-600 text-white' : ''}`}
          >
            <Bell className="w-4 h-4 mb-0.5" />
            Alerts
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase ${activeTab === 'logs' ? 'bg-blue-600 text-white' : ''}`}
          >
            <ClipboardList className="w-4 h-4 mb-0.5" />
            Audit
          </button>
        </div>

        {/* MAIN CONTAINER CONTENT WRAPPER */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STATS OVERVIEW HEADER WIDGET (Renders summary cards recursively) */}
          <DashboardStats
            beds={beds}
            patients={patients}
            bloodStock={bloodStock}
            alerts={alerts}
            onTabChange={setActiveTab}
          />

          {/* 3. TABS SCREEN RENDERING */}
          {activeTab === 'beds' && (
            <BedTracking
              beds={beds}
              patients={patients}
              onAdmitPatient={handleAdmitPatient}
              onDischargePatient={handleDischargePatient}
              onUpdateBedStatus={handleUpdateBedStatus}
              onAddActivityLog={addActivityLog}
            />
          )}

          {activeTab === 'blood' && (
            <BloodInventory
              bloodStock={bloodStock}
              patients={patients}
              onUpdateStock={handleUpdateStock}
              onAddActivityLog={addActivityLog}
            />
          )}

          {activeTab === 'alerts' && (
            <DischargeAlerts
              alerts={alerts}
              beds={beds}
              patients={patients}
              onResolveAlert={handleResolveAlert}
              onDischargePatient={handleDischargePatient}
              onCheckDischargeSchedules={handleManualCheckDischarges}
              onAddActivityLog={addActivityLog}
            />
          )}

          {activeTab === 'logs' && (
            <div id="logs-panel" className="geometric-card p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Shift Activity & Audit Ledger</h2>
                  <p className="text-xs text-slate-500">Chronological history log tracking beds assignments, blood issues, and staff triggers.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Total Entries saved: {activityLogs.length}</span>
                  <button 
                    onClick={() => {
                      if (confirm('Clear logs from current display Session?')) {
                        setActivityLogs([]);
                        saveState('hospital_logs', []);
                      }
                    }}
                    className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 hover:text-rose-600 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                  >
                    Clear Feed
                  </button>
                </div>
              </div>

              {/* Grid split: logs feed left side, clinical checklists right side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* List logs columns */}
                <div className="lg:col-span-2 space-y-3">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 text-xs">
                      No shift activities recorded during this session.
                    </div>
                  ) : (
                    <div id="logs-roll" className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {activityLogs.map((log) => {
                        const getCategoryStyle = (cat: string) => {
                          switch (cat) {
                            case 'bed': return 'bg-blue-50 text-blue-700 border-blue-100';
                            case 'patient': return 'bg-purple-50 text-purple-700 border-purple-100';
                            case 'blood': return 'bg-red-50 text-red-700 border-red-100';
                            case 'system': return 'bg-slate-100 text-slate-700 border-slate-200';
                            default: return 'bg-slate-50 text-slate-500';
                          }
                        };

                        return (
                          <div 
                            key={log.id} 
                            id={`log-row-${log.id}`}
                            className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 hover:bg-slate-100/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getCategoryStyle(log.category)}`}>
                                  {log.category}
                                </span>
                                <strong className="text-xs font-bold text-slate-800">{log.event}</strong>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-normal">{log.details}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Checklist sidebar columns */}
                <div className="space-y-6">
                  <div className="bg-slate-50/85 p-5 rounded-lg border border-slate-200 space-y-4 shadow-3xs">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-slate-700" />
                      <h3 className="text-sm font-bold text-slate-800">Coordinator Shift Checklist</h3>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      {[
                        { text: 'Validate emergency trauma holdings (2 Reserved)', completed: true },
                        { text: 'Inspect low stocks (O- Negative & AB- Negative units)', completed: false },
                        { text: 'Acknowledge automated discharge schedules', completed: false },
                        { text: 'Clear sanitized Room 102-B and 3-B2 beds', completed: false },
                        { text: 'Coordinate donor requests with state blood bank', completed: false }
                      ].map((task, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-md border border-slate-200/80">
                          <input 
                            type="checkbox" 
                            defaultChecked={task.completed}
                            className="mt-0.5 h-3.5 w-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                          <span className={task.completed ? 'text-slate-400 line-through' : 'text-slate-600 font-medium'}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
