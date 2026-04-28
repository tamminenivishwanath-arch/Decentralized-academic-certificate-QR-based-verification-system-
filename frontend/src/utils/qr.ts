import { keccak256 } from 'js-sha3';

/**
 * Normalize a hash string to canonical format: 0x + 64 lowercase hex characters
 * Throws if input cannot be normalized to valid format
 */
export function normalizeHash(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid hash input: must be a non-empty string');
  }

  // Remove 0x prefix if present and convert to lowercase
  let cleaned = input.trim().toLowerCase();
  if (cleaned.startsWith('0x')) {
    cleaned = cleaned.slice(2);
  }

  // Validate hex characters
  if (!/^[0-9a-f]+$/.test(cleaned)) {
    throw new Error('Invalid hash: contains non-hex characters');
  }

  // Validate length (should be 64 hex chars for keccak256)
  if (cleaned.length !== 64) {
    throw new Error(`Invalid hash length: expected 64 hex characters, got ${cleaned.length}`);
  }

  return `0x${cleaned}`;
}

/**
 * Compute the certificate hash locally using the same method as the backend.
 * 
 * IMPORTANT: This must match the backend's exact concatenation format.
 * Backend uses: w3.keccak(text=studentName + course + institution + issueDate)
 * We replicate this exactly using keccak256 from js-sha3.
 * 
 * @param studentName - Student's full name
 * @param course - Course/degree name
 * @param institution - Institution/university name
 * @param issueDate - Issue date in YYYY-MM-DD format
 * @returns Hash string with 0x prefix (64 hex chars)
 */
export function computeLocalHash(
  studentName: string,
  course: string,
  institution: string,
  issueDate: string
): string {
  // Concatenate fields exactly as backend does: studentName + course + institution + issueDate
  // No separators, no spaces between - direct concatenation
  const concatenated = studentName + course + institution + issueDate;
  
  // Compute keccak256 hash (same as web3.keccak)
  const hash = keccak256(concatenated);
  
  // Return with 0x prefix
  return `0x${hash}`;
}

/**
 * Convert SVG element to PNG data URL
 * Used to convert react-qr-code SVG output to downloadable PNG
 */
export async function svgToPngDataUrl(
  svgElement: SVGSVGElement,
  width: number = 256,
  height: number = 256
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      // Create a blob from the SVG string
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Create an image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create canvas with specified dimensions
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Fill white background (QR codes need contrast)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Draw the SVG image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to PNG data URL
        const pngDataUrl = canvas.toDataURL('image/png');
        
        // Clean up
        URL.revokeObjectURL(url);
        
        resolve(pngDataUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for conversion'));
      };
      
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Trigger download of a data URL
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse QR code content and extract certHash
 * Handles both raw hex strings and JSON objects
 */
export function parseQRContent(content: string): string {
  const trimmed = content.trim();
  
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.certHash) {
      return normalizeHash(parsed.certHash);
    }
  } catch {
    // Not JSON, continue to other checks
  }
  
  // Check if it's a raw hex string (with or without 0x)
  if (/^(0x)?[0-9a-fA-F]{64}$/.test(trimmed)) {
    return normalizeHash(trimmed);
  }
  
  // Try to find a hex hash pattern within the string
  const hexMatch = trimmed.match(/(0x)?([0-9a-fA-F]{64})/);
  if (hexMatch) {
    return normalizeHash(hexMatch[0]);
  }
  
  throw new Error('Could not extract certificate hash from QR code content');
}

/**
 * Generate a short hash for display (first 6 + last 4 chars)
 */
export function shortHash(hash: string): string {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}
