import React, { useEffect, useRef } from 'react';

const NetworkAlert = ({ isDisconnected, onClose }) => {
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (isDisconnected && !hasPlayedSound.current) {
      // Play red alert sound using the same approach as navigation
      const redAlertAudio = document.getElementById('redAlert');
      if (redAlertAudio) {
        redAlertAudio.currentTime = 0;
        redAlertAudio.play().catch(console.error);
      }
      hasPlayedSound.current = true;
    } else if (!isDisconnected) {
      // Stop red alert sound when reconnected
      const redAlertAudio = document.getElementById('redAlert');
      if (redAlertAudio) {
        redAlertAudio.pause();
        redAlertAudio.currentTime = 0;
      }
      hasPlayedSound.current = false;
    }
  }, [isDisconnected]);

  if (!isDisconnected) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'networkFlash 1s infinite alternate',
        fontFamily: 'inherit'
      }}
    >
      <div
        style={{
          background: 'var(--red)',
          color: 'black',
          padding: '2rem',
          borderRadius: '0 20px 0 20px',
          textAlign: 'center',
          border: '3px solid darkred',
          boxShadow: '0 0 20px rgba(255, 0, 0, 0.8)'
        }}
      >
        <h2 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          NETWORK CONNECTION LOST
        </h2>
        <div style={{ 
          fontSize: '16px',
          marginBottom: '1rem'
        }}>
          Internet connectivity has been lost. Please check your network connection.
        </div>
        <div style={{ 
          fontSize: '14px',
          opacity: 0.8
        }}>
          System will continue monitoring for reconnection...
        </div>
      </div>

      <style>{`
        @keyframes networkFlash {
          0% { backgroundColor: rgba(255, 0, 0, 0.7); }
          100% { backgroundColor: rgba(255, 0, 0, 0.4); }
        }
      `}</style>
    </div>
  );
};

export default NetworkAlert;