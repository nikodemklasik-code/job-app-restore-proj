export default function PracticeProgressBadge({ label, value }: { label: string; value: string }) {
  return <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-900">{value}</span></div>;
}
