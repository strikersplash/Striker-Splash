import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate a unique hash for QR code
export const generateQRHash = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate QR code as base64
export const generateQRCode = async (playerId: number, qrHash: string): Promise<string> => {
  try {
    // QR code data with timestamp for expiration
    const qrData = JSON.stringify({
      playerId,
      hash: qrHash,
      timestamp: Date.now()
    });

    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
    
    // Return just the base64 data without the data:image/png;base64, prefix
    return qrCodeBase64.replace('data:image/png;base64,', '');
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};