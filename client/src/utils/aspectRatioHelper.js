/**
 * Instagram Standard Aspect Ratio Helper
 * Uses exact Instagram photo size specifications
 * 
 * Standards:
 * - 4:5 (1080 x 1350px) - Portrait/Tall
 * - 1:1 (1080 x 1080px) - Square
 * - 1.91:1 (1080 x 568px) - Landscape/Wide
 */

const INSTAGRAM_RATIOS = [
  { ratio: 4/5, label: "4/5", minRatio: 0.76, maxRatio: 0.85 },    // Portrait: 0.8
  { ratio: 1, label: "1/1", minRatio: 0.95, maxRatio: 1.05 },      // Square
  { ratio: 1.91, label: "1.91/1", minRatio: 1.8, maxRatio: 2.0 }   // Landscape: 1.91
];

/**
 * Calculate aspect ratio from dimensions - INSTAGRAM EXACT
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Standard aspect ratio (4/5, 1/1, 1.91/1)
 */
export function getAspectRatio(width, height) {
  if (!width || !height) return "4/5"; // default fallback
  
  const ratio = width / height;

  // Find closest Instagram standard
  let closest = INSTAGRAM_RATIOS[0];
  let minDiff = Math.abs(ratio - closest.ratio);

  for (const standard of INSTAGRAM_RATIOS) {
    const diff = Math.abs(ratio - standard.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      closest = standard;
    }
  }

  return closest.label;
}

/**
 * Get image dimensions from URL
 * @param {string} url - Image URL
 * @returns {Promise<{width: number, height: number}>} Dimensions
 */
export function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Auto detect and cache aspect ratio
 * @param {string} url - Image URL
 * @param {Object} cache - Cache object to store results
 * @returns {Promise<string>} Aspect ratio
 */
export async function detectAspectRatio(url, cache = {}) {
  if (cache[url]) return cache[url];
  
  try {
    const { width, height } = await getImageDimensions(url);
    const ratio = getAspectRatio(width, height);
    cache[url] = ratio;
    return ratio;
  } catch (error) {
    console.warn('Error detecting aspect ratio:', error);
    return "4/5"; // fallback
  }
}

/**
 * Get Instagram standard info from ratio
 * @param {string} ratioLabel - e.g., "4/5", "1/1", "1.91/1"
 * @returns {Object} Ratio info with dimensions
 */
export function getInstagramSpec(ratioLabel) {
  const specs = {
    "4/5": { ratio: "4/5", width: 1080, height: 1350, use: "Portrait - Best for Feed" },
    "1/1": { ratio: "1/1", width: 1080, height: 1080, use: "Square - Story Alternative" },
    "1.91/1": { ratio: "1.91/1", width: 1080, height: 568, use: "Landscape - Carousel" }
  };
  return specs[ratioLabel] || specs["4/5"];
}
