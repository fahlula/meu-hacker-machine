import React from 'react';
import './WireframeCube.css';

export const WireframeCube: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <div className="cube-container" style={{ width: size, height: size }}>
      <div className="cube">
        <div className="cube-face cube-front"></div>
        <div className="cube-face cube-back"></div>
        <div className="cube-face cube-left"></div>
        <div className="cube-face cube-right"></div>
        <div className="cube-face cube-top"></div>
        <div className="cube-face cube-bottom"></div>
      </div>
    </div>
  );
};
