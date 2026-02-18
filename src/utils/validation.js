/**
 * Validate GSTIN format
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return { valid: false, error: 'GSTIN is required' };
  if (gstin.length !== 15) return { valid: false, error: 'GSTIN must be 15 characters' };
  if (!/^[0-9A-Z]{15}$/.test(gstin)) return { valid: false, error: 'Invalid GSTIN format (must be alphanumeric)' };
  return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return { valid: true }; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
};

/**
 * Validate number
 */
export const validateNumber = (value, min = 0, max = Infinity) => {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a valid number' };
  }
  if (num < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }
  if (num > max) {
    return { valid: false, error: `Must be at most ${max}` };
  }
  return { valid: true };
};

/**
 * Validate invoice data
 */
export const validateInvoice = (invoiceData) => {
  const errors = {};

  // Validate seller details
  if (!invoiceData.sellerDetails?.name) {
    errors.sellerName = 'Seller name is required';
  }
  if (!invoiceData.sellerDetails?.gstin) {
    errors.sellerGstin = 'Seller GSTIN is required';
  } else {
    const gstinValidation = validateGSTIN(invoiceData.sellerDetails.gstin);
    if (!gstinValidation.valid) {
      errors.sellerGstin = gstinValidation.error;
    }
  }

  // Validate buyer details
  if (!invoiceData.buyerDetails?.name) {
    errors.buyerName = 'Buyer name is required';
  }
  if (!invoiceData.buyerDetails?.address) {
    errors.buyerAddress = 'Buyer address is required';
  }
  if (invoiceData.buyerDetails?.gstin) {
    const gstinValidation = validateGSTIN(invoiceData.buyerDetails.gstin);
    if (!gstinValidation.valid) {
      errors.buyerGstin = gstinValidation.error;
    }
  }

  // Validate invoice details
  if (!invoiceData.invoiceDetails?.number) {
    errors.invoiceNumber = 'Invoice number is required';
  }
  if (!invoiceData.invoiceDetails?.date) {
    errors.invoiceDate = 'Invoice date is required';
  }

  // Validate items
  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    invoiceData.items.forEach((item, index) => {
      if (!item.description) {
        errors[`item${index}Description`] = 'Item description is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`item${index}Quantity`] = 'Valid quantity is required';
      }
      if (!item.rate || item.rate < 0) {
        errors[`item${index}Rate`] = 'Valid rate is required';
      }
      if (item.gstRate < 0 || item.gstRate > 100) {
        errors[`item${index}GstRate`] = 'GST rate must be between 0 and 100';
      }
    });
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

