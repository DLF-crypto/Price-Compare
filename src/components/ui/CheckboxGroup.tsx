interface CheckboxGroupProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (selected: string[]) => void;
}

export function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="grid grid-cols-2" style={{ gap: '8px 16px' }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 select-none"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="accent-sky-500 w-4 h-4 rounded"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
