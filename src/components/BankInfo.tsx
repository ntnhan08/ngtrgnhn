/* Bank details — masked by default, explicit Show + Copy, privacy-aware.
 * Comic square styling to match the nature-school theme. */
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Eye, EyeOff, Landmark } from "lucide-react";
import { groupAccount, maskAccountPrivacy, maskAccountTail } from "../utils/format";
import { Sensitive } from "./ui/Primitives";

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
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const nameVisible = showName && bankName.trim().length > 0;
  const digits = accountNumber.replace(/\D/g, "");
  const accountVisible = showAccount && digits.length > 0;
  if (!nameVisible && !accountVisible) return null;

  const plain = groupAccount(accountNumber);
  const masked = privacy ? maskAccountPrivacy(accountNumber) : maskAccountTail(accountNumber);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(digits);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = digits;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="chip-square h-11 w-11 shrink-0 bg-sun text-ink">
          <Landmark size={18} />
        </span>
        <div className="min-w-0">
          {nameVisible && <p className="text-[15px] font-extrabold text-ink">{bankName}</p>}
          {accountVisible && (
            <Sensitive
              value={plain}
              masked={masked}
              className="font-display text-[15px] font-bold tabular-nums text-muted"
            />
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {!privacy && accountVisible && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setRevealed((r) => !r)}
            className="btn-comic btn-paper px-3 py-1.5 text-xs"
            aria-pressed={revealed}
          >
            {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            {revealed ? "Hide" : "Show"}
          </motion.button>
        )}
        {accountVisible && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={copy}
            className={`btn-comic px-3 py-1.5 text-xs ${copied ? "bg-success text-onaccent" : "btn-accent"}`}
            aria-label={copied ? "Copied" : "Copy account number"}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
