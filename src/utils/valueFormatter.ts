// Format estimated value for display
export const formatEstimatedValue = (value: number | null | undefined): string => {
  if (!value || value === 0) return 'N/A';
  
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  } else {
    return `€${value}`;
  }
};

// Format salary for display
export const formatSalary = (value: string | null | undefined): string => {
  if (!value || value.trim() === '') return 'N/A';
  
  // If it already looks formatted (contains /, week, month, year, or already has K/M), return as is
  if (value.match(/\/|week|month|year|per/i) || (value.match(/[KMB]$/i) && !value.match(/^\d+$/))) {
    return value;
  }
  
  // Remove currency symbols and whitespace
  const clean = value.replace(/[€$£¥\s]/g, '');
  
  // Extract currency symbol (default to €)
  let currencySymbol = '€';
  if (value.includes('$')) currencySymbol = '$';
  else if (value.includes('£')) currencySymbol = '£';
  else if (value.includes('¥')) currencySymbol = '¥';
  
  let multiplier = 1;
  let numStr = clean;
  
  if (/M$/i.test(clean)) {
    multiplier = 1000000;
    numStr = clean.replace(/M$/i, '');
  } else if (/K$/i.test(clean)) {
    multiplier = 1000;
    numStr = clean.replace(/K$/i, '');
  } else if (/B$/i.test(clean)) {
    multiplier = 1000000000;
    numStr = clean.replace(/B$/i, '');
  }
  
  const num = parseFloat(numStr);
  if (isNaN(num)) return value;
  
  const numericValue = num * multiplier;
  
  // Format with appropriate suffix
  if (numericValue >= 1000000) {
    return `${currencySymbol}${(numericValue / 1000000).toFixed(1)}M`;
  } else if (numericValue >= 1000) {
    return `${currencySymbol}${(numericValue / 1000).toFixed(0)}K`;
  } else {
    return `${currencySymbol}${numericValue}`;
  }
};

// Parse text value to numeric
export const parseEstimatedValue = (valueText: string): number | null => {
  if (!valueText || valueText.trim() === '') return null;
  
  const clean = valueText.replace(/[€$£¥\s]/g, '');
  
  let multiplier = 1;
  let numStr = clean;
  
  if (/M$/i.test(clean)) {
    multiplier = 1000000;
    numStr = clean.replace(/M$/i, '');
  } else if (/K$/i.test(clean)) {
    multiplier = 1000;
    numStr = clean.replace(/K$/i, '');
  } else if (/B$/i.test(clean)) {
    multiplier = 1000000000;
    numStr = clean.replace(/B$/i, '');
  }
  
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num * multiplier;
};
