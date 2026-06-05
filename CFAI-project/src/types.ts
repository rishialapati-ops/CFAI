/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BedType = 'ICU' | 'General Ward' | 'Emergency' | 'Pediatrics' | 'Maternity';
export type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Reserved';
export type PatientCondition = 'Stable' | 'Guarded' | 'Severe' | 'Critical';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type AlertType = 'discharge' | 'low-blood' | 'critical-patient' | 'bed-cleaning';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: BloodGroup;
  admissionReason: string;
  condition: PatientCondition;
  admissionDate: string;
  expectedDischargeDate: string;
  assignedBedId: string | null;
}

export interface Bed {
  id: string;
  roomNumber: string;
  type: BedType;
  status: BedStatus;
  currentPatientId: string | null;
  wing: 'North Wing' | 'South Wing' | 'Emergency Wing' | 'East Wing' | 'West Wing';
}

export interface BloodStock {
  bloodGroup: BloodGroup;
  units: number;
  minThreshold: number;
}

export interface StaffAlert {
  id: string;
  timestamp: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  resolved: boolean;
  patientId?: string;
  bedId?: string;
}

export interface BedAllocationStats {
  total: number;
  available: number;
  occupied: number;
  cleaning: number;
  reserved: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  event: string;
  category: 'bed' | 'patient' | 'blood' | 'system';
  details: string;
}
