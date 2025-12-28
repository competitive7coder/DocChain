import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion } from 'framer-motion';

const QRScanner = ({ onScanSuccess, onError }) => {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // 1. We pass the STRING ID "qr-reader" instead of a Ref object
    const scanner = new Html5QrcodeScanner(
      "qr-reader", 
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        setIsScanning(false);
        // Clear the scanner after a successful scan
        scanner.clear().then(() => {
          onScanSuccess(decodedText);
        }).catch(err => console.error("Failed to clear scanner", err));
      },
      (errorMessage) => {
        // We usually don't call onError for every frame error to avoid spamming the console
        if (onError && !errorMessage.includes("No MultiFormat Readers")) {
          onError(errorMessage);
        }
      }
    );

    setIsScanning(true);

    // Cleanup function to stop the camera when the component unmounts
    return () => {
      scanner.clear().catch((err) => {
        console.error('Error clearing scanner:', err);
      });
    };
  }, [onScanSuccess, onError]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto"
    >
      <div id="qr-reader" className="w-full overflow-hidden rounded-lg shadow-inner" />
      
      {isScanning && (
        <p className="text-center text-gray-600 mt-4 animate-pulse">
          Position the QR code within the frame
        </p>
      )}
    </motion.div>
  );
};

export default QRScanner;