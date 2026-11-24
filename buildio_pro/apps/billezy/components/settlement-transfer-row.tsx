import { Button } from "@workspace/ui/components/button";

import {
  MemberPaymentDetails,
  type PaymentDetailsMember,
  type SavePaymentDetails,
} from "@/components/member-payment-details";

export function SettlementTransferRow({
  payerName,
  recipient,
  amount,
  onSavePaymentDetails,
  onRecord,
}: {
  payerName: string;
  recipient: PaymentDetailsMember;
  amount: string;
  onSavePaymentDetails: SavePaymentDetails;
  onRecord: () => void;
}) {
  const instruction = `${payerName} pays ${recipient.name}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-x-1 text-sm">
        <span className="font-medium wrap-anywhere">{instruction}</span>
        <MemberPaymentDetails member={recipient} onSave={onSavePaymentDetails} />
        <span className="basis-full font-mono text-lg font-bold wrap-anywhere">
          {amount}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Record as paid: ${instruction} ${amount}`}
        onClick={onRecord}
      >
        Record as paid
      </Button>
    </li>
  );
}
