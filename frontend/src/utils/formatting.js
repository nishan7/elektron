// frontend/src/utils/formatting.js

/**
 * Formats a power reading, converting to kW if it\'s large.
 * @param {number} watts - The power reading in watts.
 * @param {object} options - Formatting options.
 * @param {number} options.kwThreshold - Threshold in watts to convert to kW (e.g., 1000).
 * @param {number} options.decimalPlaces - Number of decimal places.
 * @param {boolean} options.useThousandsSeparator - Whether to use thousands separators.
 * @returns {string} Formatted power string with unit.
 */
export const formatPower = (watts, options = {}) => {
  const {
    kwThreshold = 1000,
    decimalPlaces = 2,
    useThousandsSeparator = true,
  } = options;

  if (typeof watts !== 'number' || isNaN(watts)) {
    return 'N/A'; // Or some other placeholder for invalid input
  }

  let value = watts;
  let unit = 'W';

  if (Math.abs(watts) >= kwThreshold) {
    value = watts / 1000;
    unit = 'kW';
  }

  const numberFormatOptions = {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: useThousandsSeparator, // This enables thousands separators
  };

  // Intl.NumberFormat is great for localization and complex formatting
  const formatter = new Intl.NumberFormat(navigator.language || 'en-US', numberFormatOptions);

  return `${formatter.format(value)} ${unit}`;
};

/**
 * Formats an energy reading (assuming kWh).
 * @param {number} kwh - The energy reading in kWh.
 * @param {object} options - Formatting options.
 * @param {number} options.decimalPlaces - Number of decimal places.
 * @param {boolean} options.useThousandsSeparator - Whether to use thousands separators.
 * @returns {string} Formatted energy string with unit.
 */
export const formatEnergy = (kwh, options = {}) => {
  const { decimalPlaces = 2, useThousandsSeparator = true } = options;

  if (typeof kwh !== 'number' || isNaN(kwh)) {
    return 'N/A';
  }

  const numberFormatOptions = {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: useThousandsSeparator,
  };
  const formatter = new Intl.NumberFormat(navigator.language || 'en-US', numberFormatOptions);

  return `${formatter.format(kwh)} kWh`;
};
