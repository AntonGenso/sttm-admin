import { passwordRules } from "../utils/password";

// Live checklist: react-hook-form only surfaces one error at a time, this shows
// everything that is still missing while the user types.
export const PasswordRequirements = ({ value }: { value: string }) => (
  <ul className="mt-2 space-y-1">
    {passwordRules
      .filter((rule) => rule.showInChecklist !== false)
      .map((rule) => {
        const isMet = value.length > 0 && rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 font-mono text-xs ${
              isMet ? "text-cyan-bright" : "text-grey/70"
            }`}
          >
            <span aria-hidden="true">{isMet ? "✓" : "•"}</span>
            {rule.label}
          </li>
        );
      })}
  </ul>
);
