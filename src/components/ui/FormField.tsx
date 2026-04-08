type Props = {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
};

export function FormField({ label, name, required, children, hint }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

const base = "bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors w-full";

export function Input({ name, defaultValue = "", required, placeholder }: {
  name: string; defaultValue?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <input
      id={name} name={name} defaultValue={defaultValue}
      required={required} placeholder={placeholder}
      className={base}
    />
  );
}

export function Textarea({ name, defaultValue = "", required, rows = 3, placeholder }: {
  name: string; defaultValue?: string; required?: boolean; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      id={name} name={name} defaultValue={defaultValue}
      required={required} rows={rows} placeholder={placeholder}
      className={`${base} resize-none`}
    />
  );
}

export function Select({ name, defaultValue = "", options, required }: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <select id={name} name={name} defaultValue={defaultValue} required={required} className={base}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}