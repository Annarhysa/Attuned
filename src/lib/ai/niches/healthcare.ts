import { NicheDictionary } from './techAiFintech';

export const healthcare: NicheDictionary = {
  id: 'healthcare',
  label: 'Healthcare',
  skills: {
    'Patient Care': ['patient care', 'direct patient care', 'bedside manner'],
    HIPAA: ['hipaa', 'patient privacy', 'phi compliance'],
    'Electronic Health Records': ['ehr', 'electronic health record', 'electronic medical record', 'emr', 'epic', 'cerner'],
    'Clinical Documentation': ['clinical documentation', 'charting', 'progress notes'],
    Triage: ['triage', 'patient assessment'],
    'Medication Administration': ['medication administration', 'med pass', 'pharmacology'],
    'Vital Signs Monitoring': ['vital signs', 'vitals monitoring'],
    'Care Coordination': ['care coordination', 'case management', 'discharge planning'],
    'Clinical Operations': ['clinical operations', 'clinic workflow'],
    'Infection Control': ['infection control', 'ppe protocols', 'sterile technique'],
    'Medical Coding': ['medical coding', 'icd-10', 'cpt coding'],
    'Regulatory Compliance': ['regulatory compliance', 'joint commission', 'cms compliance'],
    'Patient Education': ['patient education', 'health literacy'],
    'Telehealth': ['telehealth', 'telemedicine', 'virtual care'],
    'Quality Improvement': ['quality improvement', 'quality assurance', 'performance improvement'],
    BLS: ['bls', 'basic life support'],
    ACLS: ['acls', 'advanced cardiac life support'],
    'Clinical Research': ['clinical research', 'clinical trials', 'gcp'],
  },
  domainTerms: [
    'patient outcomes', 'evidence-based practice', 'interdisciplinary team', 'scope of practice',
    'continuity of care', 'population health', 'value-based care',
  ],
  softSkills: [
    'empathy', 'communication', 'attention to detail', 'critical thinking', 'teamwork',
    'compassion', 'cultural competency', 'stress management',
  ],
  toneDefault: 'professional',
  seniorityMarkers: {
    intern: ['student', 'clinical rotation', 'intern'],
    junior: ['new graduate', 'entry-level', 'staff nurse', 'associate'],
    mid: ['registered nurse', 'clinician', 'mid-level'],
    senior: ['senior', 'charge nurse', 'lead clinician'],
    manager: ['nurse manager', 'director of nursing', 'clinical director'],
  },
  companySignalMarkers: [
    'patient-centered', 'nonprofit', 'academic medical center', 'community health',
    'acute care', 'outpatient', 'magnet-designated', 'regulated environment',
  ],
};
