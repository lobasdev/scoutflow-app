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
