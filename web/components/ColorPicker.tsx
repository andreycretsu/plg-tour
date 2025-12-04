'use client';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  showInput?: boolean;
}

export default function ColorPicker({ value, onChange, showInput = true }: ColorPickerProps) {
  return (
    <div className="flex gap-2 items-center">
      {/* Square color picker container - 42x42px with light gray bg */}
      <div 
        className="relative rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden"
        style={{ width: 42, height: 42, backgroundColor: '#f5f5f5' }}
      >
        <div 
          className="w-5 h-5 rounded-full"
          style={{ 
            backgroundColor: value,
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      {/* Optional hex input */}
      {showInput && (
        <input
          type="text"
          className="input flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      )}
    </div>
  );
}

