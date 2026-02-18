/**
 * Convert image file to base64
 */
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Save logo to localStorage
 */
export const saveLogo = async (file) => {
  try {
    const base64 = await convertImageToBase64(file);
    localStorage.setItem('companyLogo', base64);
    return base64;
  } catch (error) {
    throw error;
  }
};

/**
 * Get logo from localStorage
 */
export const getLogo = () => {
  return localStorage.getItem('companyLogo');
};

/**
 * Remove logo from localStorage
 */
export const removeLogo = () => {
  localStorage.removeItem('companyLogo');
};

/**
 * Validate image file
 */
export const validateImageFile = (file, maxSizeMB = 2) => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }
  
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return { valid: false, error: `Image size must be less than ${maxSizeMB}MB` };
  }
  
  return { valid: true };
};

