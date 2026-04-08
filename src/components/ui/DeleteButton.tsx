"use client";

type Props = { action: () => Promise<void>; label?: string };

export function DeleteButton({ action, label = "Eliminar" }: Props) {
  async function handleClick() {
    if (!confirm("¿Estás seguro? Esta acción no se puede deshacer.")) return;
    await action();
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 px-4 py-2 rounded-lg transition-colors"
    >
      {label}
    </button>
  );
}