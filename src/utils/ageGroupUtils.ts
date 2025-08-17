// Age Group Utilities
// This file contains utility functions for age group calculations

export function calculateAgeGroup(dob: Date): string {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age <= 10) {
    return "Up to 10 years";
  } else if (age <= 17) {
    return "Teens 11-17 years";
  } else if (age <= 30) {
    return "Young Adults 18-30 years";
  } else if (age <= 50) {
    return "Adults 31-50 years";
  } else {
    return "Seniors 51+ years";
  }
}

export function getAgeGroupSQLCase(): string {
  return `
    CASE 
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 10 THEN 'Up to 10 years'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 17 THEN 'Teens 11-17 years'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 30 THEN 'Young Adults 18-30 years'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 50 THEN 'Adults 31-50 years'
      ELSE 'Seniors 51+ years'
    END
  `;
}
