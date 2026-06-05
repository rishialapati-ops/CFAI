/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bed, Patient, BloodStock, StaffAlert, ActivityLog } from '../types';

export const INITIAL_BEDS: Bed[] = [
  // ICU Beds
  { id: 'BED-ICU-101', roomNumber: 'Room 101-A', type: 'ICU', status: 'Occupied', currentPatientId: 'PAT-001', wing: 'North Wing' },
  { id: 'BED-ICU-102', roomNumber: 'Room 101-B', type: 'ICU', status: 'Occupied', currentPatientId: 'PAT-002', wing: 'North Wing' },
  { id: 'BED-ICU-103', roomNumber: 'Room 102-A', type: 'ICU', status: 'Available', currentPatientId: null, wing: 'North Wing' },
  { id: 'BED-ICU-104', roomNumber: 'Room 102-B', type: 'ICU', status: 'Cleaning', currentPatientId: null, wing: 'North Wing' },

  // Emergency Care Beds
  { id: 'BED-ER-201', roomNumber: 'ER Bay 1', type: 'Emergency', status: 'Occupied', currentPatientId: 'PAT-003', wing: 'Emergency Wing' },
  { id: 'BED-ER-202', roomNumber: 'ER Bay 2', type: 'Emergency', status: 'Available', currentPatientId: null, wing: 'Emergency Wing' },
  { id: 'BED-ER-203', roomNumber: 'ER Bay 3', type: 'Emergency', status: 'Reserved', currentPatientId: null, wing: 'Emergency Wing' },
  { id: 'BED-ER-204', roomNumber: 'ER Bay 4', type: 'Emergency', status: 'Available', currentPatientId: null, wing: 'Emergency Wing' },

  // General Ward Beds
  { id: 'BED-GEN-301', roomNumber: 'Ward 3-A1', type: 'General Ward', status: 'Occupied', currentPatientId: 'PAT-004', wing: 'East Wing' },
  { id: 'BED-GEN-302', roomNumber: 'Ward 3-A2', type: 'General Ward', status: 'Occupied', currentPatientId: 'PAT-005', wing: 'East Wing' },
  { id: 'BED-GEN-303', roomNumber: 'Ward 3-B1', type: 'General Ward', status: 'Available', currentPatientId: null, wing: 'East Wing' },
  { id: 'BED-GEN-304', roomNumber: 'Ward 3-B2', type: 'General Ward', status: 'Cleaning', currentPatientId: null, wing: 'East Wing' },
  { id: 'BED-GEN-305', roomNumber: 'Ward 3-C1', type: 'General Ward', status: 'Available', currentPatientId: null, wing: 'East Wing' },
  { id: 'BED-GEN-306', roomNumber: 'Ward 3-C2', type: 'General Ward', status: 'Available', currentPatientId: null, wing: 'East Wing' },

  // Pediatrics Beds
  { id: 'BED-PED-401', roomNumber: 'Room 401-A', type: 'Pediatrics', status: 'Occupied', currentPatientId: 'PAT-006', wing: 'West Wing' },
  { id: 'BED-PED-402', roomNumber: 'Room 401-B', type: 'Pediatrics', status: 'Available', currentPatientId: null, wing: 'West Wing' },
  { id: 'BED-PED-403', roomNumber: 'Room 402-A', type: 'Pediatrics', status: 'Available', currentPatientId: null, wing: 'West Wing' },

  // Maternity Beds
  { id: 'BED-MAT-501', roomNumber: 'Room 501-A', type: 'Maternity', status: 'Occupied', currentPatientId: 'PAT-007', wing: 'South Wing' },
  { id: 'BED-MAT-502', roomNumber: 'Room 501-B', type: 'Maternity', status: 'Available', currentPatientId: null, wing: 'South Wing' },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT-001',
    name: 'Robert Jenkins',
    age: 62,
    gender: 'Male',
    bloodGroup: 'O+',
    admissionReason: 'Cardiovascular post-op recovery',
    condition: 'Severe',
    admissionDate: '2026-06-01',
    expectedDischargeDate: '2026-06-12',
    assignedBedId: 'BED-ICU-101'
  },
  {
    id: 'PAT-002',
    name: 'Elena Rostova',
    age: 45,
    gender: 'Female',
    bloodGroup: 'O-',
    admissionReason: 'Severe respiratory distress secondary to pneumonia',
    condition: 'Critical',
    admissionDate: '2026-06-03',
    expectedDischargeDate: '2026-06-15',
    assignedBedId: 'BED-ICU-102'
  },
  {
    id: 'PAT-003',
    name: 'Marcus Brody',
    age: 28,
    gender: 'Male',
    bloodGroup: 'AB+',
    admissionReason: 'Multiple fracture stabilization (Trauma)',
    condition: 'Guarded',
    admissionDate: '2026-06-04',
    expectedDischargeDate: '2026-06-08',
    assignedBedId: 'BED-ER-201'
  },
  {
    id: 'PAT-004',
    name: 'Sarah Jenkins',
    age: 71,
    gender: 'Female',
    bloodGroup: 'A+',
    admissionReason: 'Chronic kidney infection post-treatment observation',
    condition: 'Stable',
    // Setting discharge date to today (2026-06-05) to trigger the automated alert immediately
    admissionDate: '2026-05-30',
    expectedDischargeDate: '2026-06-05',
    assignedBedId: 'BED-GEN-301'
  },
  {
    id: 'PAT-005',
    name: 'David Kim',
    age: 38,
    gender: 'Male',
    bloodGroup: 'B-',
    admissionReason: 'Appendectomy recovery',
    condition: 'Stable',
    admissionDate: '2026-06-02',
    expectedDischargeDate: '2026-06-06',
    assignedBedId: 'BED-GEN-302'
  },
  {
    id: 'PAT-006',
    name: 'Liam Vance',
    age: 9,
    gender: 'Male',
    bloodGroup: 'A-',
    admissionReason: 'Asthma exacerbation monitoring',
    condition: 'Stable',
    // Setting discharge date to yesterday (2026-06-04) to represent an overdue discharge alert
    admissionDate: '2026-06-02',
    expectedDischargeDate: '2026-06-04',
    assignedBedId: 'BED-PED-401'
  },
  {
    id: 'PAT-007',
    name: 'Sophie Dubois',
    age: 31,
    gender: 'Female',
    bloodGroup: 'AB-',
    admissionReason: 'Healthy postpartum monitoring',
    condition: 'Stable',
    admissionDate: '2026-06-03',
    expectedDischargeDate: '2026-06-07',
    assignedBedId: 'BED-MAT-501'
  }
];

export const INITIAL_BLOOD_STOCK: BloodStock[] = [
  { bloodGroup: 'A+', units: 24, minThreshold: 10 },
  { bloodGroup: 'A-', units: 12, minThreshold: 8 },
  { bloodGroup: 'B+', units: 18, minThreshold: 10 },
  { bloodGroup: 'B-', units: 6, minThreshold: 6 }, // On threshold limit
  { bloodGroup: 'AB+', units: 15, minThreshold: 5 },
  { bloodGroup: 'AB-', units: 4, minThreshold: 5 },  // Critically low (below 5)
  { bloodGroup: 'O+', units: 45, minThreshold: 15 },
  { bloodGroup: 'O-', units: 3, minThreshold: 10 }   // Extremely low (Universal donor!)
];

export const INITIAL_ALERTS: StaffAlert[] = [
  {
    id: 'ALERT-001',
    timestamp: '2026-06-05T01:30:00Z',
    type: 'low-blood',
    message: 'Critical blood shortage: O- Negative stock is at 3 units (Min: 10). Urgent donation call required.',
    severity: 'critical',
    resolved: false
  },
  {
    id: 'ALERT-002',
    timestamp: '2026-06-05T03:00:00Z',
    type: 'discharge',
    message: 'Automated Alert: Patient Sarah Jenkins (Room Ward 3-A1) is scheduled for discharge today.',
    severity: 'info',
    resolved: false,
    patientId: 'PAT-004',
    bedId: 'BED-GEN-301'
  },
  {
    id: 'ALERT-003',
    timestamp: '2026-06-05T03:15:00Z',
    type: 'discharge',
    message: 'Action Required: Liam Vance (Room Room 401-A) is past due for scheduled discharge since yesterday.',
    severity: 'warning',
    resolved: false,
    patientId: 'PAT-006',
    bedId: 'BED-PED-401'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  { id: 'LOG-001', timestamp: '2026-06-05T00:10:00Z', event: 'Emergency Bed Occupied', category: 'bed', details: 'Patient Marcus Brody assigned to BED-ER-201' },
  { id: 'LOG-002', timestamp: '2026-06-05T01:00:00Z', event: 'Blood Stock Utilized', category: 'blood', details: 'Used 2 units of O- Negative blood for Patient Elena Rostova (ICU)' },
  { id: 'LOG-003', timestamp: '2026-06-05T02:00:00Z', event: 'Bed Transferred to Cleaning', category: 'bed', details: 'BED-GEN-304 marked for terminal cleaning post-discharge' },
  { id: 'LOG-004', timestamp: '2026-06-05T03:00:00Z', event: 'Discharge Schedule Auto-Check', category: 'system', details: 'Automated rules triggered 2 discharge alerts for today.' }
];
