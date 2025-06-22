/**
 * Utility functions for date formatting and parsing
 * Handles compatibility between frontend and backend date formats
 */

/**
 * Parse date from various backend formats
 * @param {string|Date} dateValue - Date value from backend
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDateFromBackend = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already a Date object, return it
  if (dateValue instanceof Date) return dateValue;
  
  // If it's an ISO string (contains 'T')
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return new Date(dateValue);
  }
  
  // If it's a string in DD-MM-YYYY format
  if (typeof dateValue === 'string' && dateValue.includes('-')) {
    const parts = dateValue.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  
  // Fallback to standard Date parsing
  try {
    return new Date(dateValue);
  } catch (error) {
    console.warn('Failed to parse date:', dateValue);
    return null;
  }
};

/**
 * Format date for backend API (DD-MM-YYYY with zero-padding)
 * @param {Date|string} date - Date to format
 * @returns {string|null} Formatted date string or null if invalid
 */
export const formatDateForApi = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Format date for display (Italian format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('it-IT');
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string for input fields
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date is valid
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Get current date in DD-MM-YYYY format
 * @returns {string} Current date formatted for API
 */
export const getCurrentDateForApi = () => {
  return formatDateForApi(new Date());
};

/**
 * Get current date in YYYY-MM-DD format for input fields
 * @returns {string} Current date formatted for input
 */
export const getCurrentDateForInput = () => {
  return formatDateForInput(new Date());
};

/**
 * Calculate age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number} Age in years
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Convert date from one format to another
 * @param {string|Date} date - Date to convert
 * @param {string} targetFormat - Target format ('api', 'display', 'input')
 * @returns {string} Converted date string
 */
export const convertDateFormat = (date, targetFormat) => {
  if (!date) return '';
  
  switch (targetFormat) {
    case 'api':
      return formatDateForApi(date);
    case 'display':
      return formatDateDisplay(date);
    case 'input':
      return formatDateForInput(date);
    default:
      return formatDateDisplay(date);
  }
};

/**
 * Validate and normalize date object for forms
 * Handles all the various date field names that might come from backend
 * @param {Object} obj - Object containing date fields
 * @param {Array} dateFields - Array of possible date field names
 * @returns {Object} Object with normalized date fields
 */
export const normalizeDateFields = (obj, dateFields = []) => {
  if (!obj) return {};
  
  const normalized = { ...obj };
  
  dateFields.forEach(fieldName => {
    // Check various possible field names (handle typos and variations)
    const possibleNames = [
      fieldName,
      fieldName.replace('Data', 'data'),
      fieldName.replace('Date', 'date'),
      fieldName.replace('Birth', 'birh'), // Handle typo
      fieldName.replace('Inscription', 'incription'), // Handle typo
    ];
    
    for (const name of possibleNames) {
      if (obj[name]) {
        normalized[fieldName] = parseDateFromBackend(obj[name]);
        break;
      }
    }
  });
  
  return normalized;
};

/**
 * Get date range for current sports year (September 1 to August 31)
 * @returns {Object} Object with start and end dates
 */
export const getCurrentSportsYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  // If we're before September (month 8), use previous year as start
  const startYear = currentMonth < 8 ? currentYear - 1 : currentYear;
  const endYear = startYear + 1;
  
  return {
    start: new Date(startYear, 8, 1), // September 1
    end: new Date(endYear, 7, 31), // August 31
    name: `${startYear}/${endYear}`
  };
};