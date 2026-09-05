/* Bank details — always masked, read-only, privacy-aware.
 * Blocky item-slot styling to match the Minecraft theme. */
import { Landmark } from "lucide-react";
import { maskAccountPrivacy, maskAccountTail } from "../utils/format";

export function BankInfo({
  bankName,
  accountNumber,
  privacy,
  showName = true,
  showAccount = true,
}: {
  bankName: string;
  accountNumber: string;
  privacy: boolean;
  showName?: boolean;
  showAccount?: boolean;
}) {
  const nameVisible = showName && bankName.trim().length > 0;
  const digits = accountNumber.replace(/\D/g, "");
  const accountVisible = showAccount && digits.length > 0;
  if (!nameVisible && !accountVisible) return null;

  const masked = privacy ? maskAccountPrivacy(accountNumber) : maskAccountTail(accountNumber);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="chip-square h-11 w-11 shrink-0 bg-sun text-ink">
          <Landmark size={18} />
        </span>
        <div className="min-w-0">
          {nameVisible && <p className="text-[15px] font-extrabold text-ink">{bankName}</p>}
          {accountVisible && (
            <p className="font-display text-[15px] font-bold tabular-nums text-muted">{masked}</p>
          )}
        </div>
      </div>
    </div>
  );
}
