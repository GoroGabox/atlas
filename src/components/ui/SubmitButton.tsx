"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label = "Guardar", loadingLabel = "Guardando..." }: {
  label?: string; loadingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
    >
      {pending ? loadingLabel : label}
    </button>
  );
}