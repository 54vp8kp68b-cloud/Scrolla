export default function AuthInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="w-full h-11 px-3.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition"
      />
    </label>
  );
}
