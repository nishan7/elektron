// deviceUtils.js - Helper functions related to device operations

/**
 * Extract device ID, handling different MongoDB ObjectId representations
 * @param {Object|String} deviceIdField - Device ID field, can be a string or an object (with $oid property)
 * @returns {String} Standardized device ID string
 */
export const extractDeviceId = (device) => {
  if (!device) return null;
  
  let deviceId = null;
  
  // Handle _id field
  if (device._id) {
    if (typeof device._id === 'object' && device._id.$oid) {
      deviceId = device._id.$oid;
    } else {
      deviceId = String(device._id);
    }
  } 
  // Handle id field
  else if (device.id) {
    deviceId = String(device.id);
  }
  
  return deviceId;
};

/**
 * Format device type name (capitalize first letter, suitable for display)
 * @param {String} type - Device type
 * @returns {String} Formatted device type name
 */
export const formatDeviceType = (type) => {
  if (!type) return 'Unknown';
  
  return type
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Filter active devices
 * @param {Array} devices - Array of devices
 * @returns {Array} Array of active devices
 */
export const getActiveDevices = (devices) => {
  if (!devices || !Array.isArray(devices)) return [];
  return devices.filter(device => device.is_active);
};

/**
 * Check if a device is of a specific type
 * @param {Object} device - Device object
 * @param {String} targetType - Target device type
 * @returns {Boolean} Whether it matches the target type
 */
export const isDeviceType = (device, targetType) => {
  if (!device || !targetType) return false;
  
  const deviceType = device.device_type || device.type || '';
  return deviceType.toLowerCase() === targetType.toLowerCase();
}; 