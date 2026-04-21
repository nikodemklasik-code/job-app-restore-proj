export type EstimatedSpendInlineNoticeProps = {
  estimatedCredits: number | null;
  billedCredits?: number | null;
  className?: string;
};

/**
 * Neutral inline helper for cost communication.
 * Keep this presentation-only to avoid impacting billing flow.
 */
export function EstimatedSpendInlineNotice({
  estimatedCredits,
  billedCredits = null,
  className = '',
}: EstimatedSpendInlineNoticeProps) {
  if (estimatedCredits === null && billedCredits === null) return null;

  return (
    <p className={`text-xs text-slate-400 ${className}`.trim()}>
      {estimatedCredits !== null ? (
        <>Estimated cost: <span className="font-semibold text-slate-200">{estimatedCredits}</span> credits.</>
      ) : null}
      {estimatedCredits !== null && billedCredits !== null ? ' ' : null}
      {billedCredits !== null ? (
        <>Final charge: <span className="font-semibold text-slate-200">{billedCredits}</span> credits.</>
      ) : null}
    </p>
  );
}

