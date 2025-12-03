import React from 'react';

interface BeaconProps {
  x: number;
  y: number;
  onClick: () => void;
}

export const Beacon: React.FC<BeaconProps> = ({ x, y, onClick }) => {
  return (
    <div
      className="tourlayer-beacon"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={onClick}
    />
  );
};

