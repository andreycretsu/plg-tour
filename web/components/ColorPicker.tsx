'use client';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  showInput?: boolean;
}

export default function ColorPicker({ value, onChange, showInput = true }: ColorPickerProps) {
  return (
    <div className="flex gap-2 items-center">
      {/* Square color picker container */}
      <div className="relative w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center bg-white overflow-hidden">
        <div 
          className="w-5 h-5 rounded-full"
          style={{ backgroundColor: value }}
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

