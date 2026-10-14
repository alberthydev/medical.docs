import { PatientAnalysis } from '../types';

export function getMarkdownForPatient(patient: PatientAnalysis): string {
  return patient?.markdown || '';
}
