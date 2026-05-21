import { CreditCostPreview } from '@/components/billing/CreditCostPreview';
import CoachPageBase from './CoachPageBase';

export default function CoachPage() {
  return (
    <div className="space-y-4">
      <CreditCostPreview feature="coach_session" title="Coach evaluation credit check" />
      <CoachPageBase />
    </div>
  );
}
