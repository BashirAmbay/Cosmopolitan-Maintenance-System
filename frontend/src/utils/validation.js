/**
 * Utility functions for authentication & validation
 */

/**
 * Checks if an email address belongs to Cosmopolitan University Abuja
 * @param {string} email 
 * @returns {boolean}
 */
export const isCosmopolitanEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  
  // Accepts standard Cosmopolitan University domain formats
  return (
    clean.endsWith('@cosmopolitan.edu.ng') ||
    clean.endsWith('@cosmopolitan.ng') ||
    clean.endsWith('@cosmopolitanuniversity.edu.ng')
  );
};
