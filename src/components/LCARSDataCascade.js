import React, { useState, useEffect } from 'react';

const LCARSDataCascade = ({ 
  frozen = false, 
  columns = 6, 
  rows = 7,
  className = '' 
}) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Generate random data for the cascade, note that this was just in the template I found and we can remove or change it.
    const generateRandomData = () => {
      const newData = [];
      for (let col = 0; col < columns; col++) {
        const column = [];
        for (let row = 1; row <= rows; row++) {
          // Generate random numbers in LCARS style
          const value = Math.floor(Math.random() * 9999999);
          column.push(value);
        }
        newData.push(column);
      }
      return newData;
    };

    setData(generateRandomData());

    if (!frozen) {
      // Update data periodically to simulate data cascade
      const interval = setInterval(() => {
        setData(generateRandomData());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [frozen, columns, rows]);

  const wrapperId = frozen ? "frozen" : "default";

  // Calculate dynamic height based on number of rows, top header spacing was weird so I wanted it
  const dynamicHeight = `${rows * 0.875}rem`; // Reduced spacing: ~0.875rem per row + small padding

  return (
    <div 
      className={`data-cascade-wrapper ${className}`} 
      id={wrapperId}
      style={{
        height: dynamicHeight,
        minHeight: dynamicHeight
      }}
    >
      {data.map((column, colIndex) => (
        <div key={colIndex} className="data-column">
          {column.map((value, rowIndex) => (
            <div 
              key={rowIndex} 
              className={`dc-row-${rowIndex + 1}`}
              style={{
                height: '1.4rem',
                lineHeight: '1.3',
                marginBottom: '0.1rem'
              }}
            >
              {value}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default LCARSDataCascade;