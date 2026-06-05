/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BedDouble, Droplet, UserCheck, Activity, Brain } from 'lucide-react';
import { Bed, Patient, BloodStock, StaffAlert } from '../types';

interface DashboardStatsProps {
  beds: Bed[];
  patients: Patient[];
  bloodStock: BloodStock[];
  alerts: StaffAlert[];
  onTabChange: (tab: string) => void;
}

export default function DashboardStats({
  beds,
  patients,
  bloodStock,
  alerts,
  onTabChange,
}: DashboardStatsProps) {
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length;
  const cleaningBeds = beds.filter((b) => b.status === 'Cleaning').length;
  const availableBeds = beds.filter((b) => b.status === 'Available').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const lowBloodCount = bloodStock.filter((b) => b.units < b.minThreshold).length;
  const activeDischargesCount = alerts.filter((a) => !a.resolved && a.type === 'discharge').length;
  
  // ICU Specific Check
  const icuBeds = beds.filter((b) => b.type === 'ICU');
  const occupiedIcuBeds = icuBeds.filter((b) => b.status === 'Occupied').length;
  const icuOccupancyRate = icuBeds.length > 0 ? Math.round((occupiedIcuBeds / icuBeds.length) * 100) : 0;
  
  // Patients in critical condition
  const criticalPatientsCount = patients.filter((p) => p.condition === 'Critical').length;

  return (
    <div id="stat-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Bed Occupancy Card */}
      <button
        id="stat-beds-card"
        onClick={() => onTabChange('beds')}
        className="flex items-start justify-between p-5 geometric-card border border-slate-200 hover:border-blue-400 text-left group"
      >
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Bed Occupancy</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{occupiedBeds}</span>
            <span className="text-sm font-medium text-slate-400">/ {totalBeds} Beds</span>
          </div>
          <div className="pt-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{occupancyRate}% Occupied</span>
              <span>{availableBeds} Available ({cleaningBeds} Cleaning)</span>
            </div>
          </div>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
          <BedDouble className="w-5 h-5" />
        </div>
      </button>

      {/* Blood Stock Status Card */}
      <button
        id="stat-blood-card"
        onClick={() => onTabChange('blood')}
        className="flex items-start justify-between p-5 geometric-card border border-slate-200 hover:border-rose-400 text-left group"
      >
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Blood Inventory</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{lowBloodCount}</span>
            <span className="text-sm font-medium text-rose-500 font-semibold">Low Groups</span>
          </div>
          <div className="pt-2">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <div className={`w-2 h-2 rounded-full ${lowBloodCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className={lowBloodCount > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}>
                {lowBloodCount > 0 ? 'Action required for shortages' : 'All blood reserves optimal'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Critical demand: O- Negative, AB- Negative 
            </div>
          </div>
        </div>
        <div className={`p-3 rounded-lg transition-colors ${
          lowBloodCount > 0 ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-100' : 'bg-slate-50 text-slate-500'
        }`}>
          <Droplet className={`w-5 h-5 ${lowBloodCount > 0 ? 'animate-bounce' : ''}`} />
        </div>
      </button>

      {/* Pending Discharges Card */}
      <button
        id="stat-discharges-card"
        onClick={() => onTabChange('alerts')}
        className="flex items-start justify-between p-5 geometric-card border border-slate-200 hover:border-amber-400 text-left group"
      >
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Discharge Alerts</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{activeDischargesCount}</span>
            <span className="text-sm font-medium text-amber-600 font-semibold">Pending</span>
          </div>
          <div className="pt-2 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">Auto-Alert</span>
              <span>Discharges free up busy wings</span>
            </div>
            <span className="text-[10px] text-slate-400 inline-block mt-1">
              Requires confirmation from doctor/nurse
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg transition-colors ${
          activeDischargesCount > 0 ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-slate-50 text-slate-500'
        }`}>
          <UserCheck className="w-5 h-5" />
        </div>
      </button>

      {/* ICU Occupancy Card */}
      <div
        id="stat-icu-card"
        className="flex items-start justify-between p-5 geometric-card border border-slate-200 group"
      >
        <div className="space-y-2 w-full">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Critical Care (ICU)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{occupiedIcuBeds}</span>
            <span className="text-sm font-medium text-slate-400">/ {icuBeds.length} Occupied</span>
          </div>
          <div className="pt-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                style={{ width: `${icuOccupancyRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span className={icuOccupancyRate >= 75 ? 'text-rose-600 font-medium' : 'text-slate-400'}>
                {icuOccupancyRate}% ICU Capacity
              </span>
              <span>{criticalPatientsCount} in critical state</span>
            </div>
          </div>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <Activity className="w-5 h-5 animate-pulse-subtle" />
        </div>
      </div>
    </div>
  );
}
