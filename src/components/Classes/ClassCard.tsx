import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rotateClassCode } from "../../api/classes";
import type { IClass } from "../../types/classes";

interface Props {
  data: IClass;
}

export const ClassCard = ({ data }: Props) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isConfirmingRotate, setIsConfirmingRotate] = useState(false);

  const queryClient = useQueryClient();

  const { mutate: rotate, isPending } = useMutation({
    mutationFn: () => rotateClassCode(data.id),
    onSuccess: (updated) => {
      // Patch the row in place so the new code shows up without a refetch flash.
      queryClient.setQueryData<IClass[]>(["classes", "my"], (classes) =>
        classes?.map((item) => (item.id === updated.id ? updated : item)),
      );
      queryClient.invalidateQueries({ queryKey: ["classes", "my"] });
      setIsConfirmingRotate(false);
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.join_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the code stays visible on the card.
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-6 backdrop-blur-md">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
          {data.city_name}
        </span>
        <h3 className="mt-1 text-3xl font-semibold text-white">
          {data.grade}
          {data.letter}
        </h3>
        <p className="mt-1 text-lg text-grey">{data.school_name}</p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-grey">
          Join code
        </span>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-cyan-bright/30 bg-[rgba(2,37,51,0.6)] px-4 py-2 font-mono text-2xl tracking-[0.3em] text-cyan-bright">
            {data.join_code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-cyan-bright/40 px-4 py-1.5 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10"
          >
            {isCopied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-lg text-grey">
          {data.students_count}{" "}
          {data.students_count === 1 ? "student" : "students"}
        </span>

        {isConfirmingRotate ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingRotate(false)}
              className="rounded-full border border-white/20 px-4 py-1.5 text-base text-grey transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => rotate()}
              disabled={isPending}
              className="rounded-full bg-orange-bright/90 px-4 py-1.5 text-base font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {isPending ? "Changing..." : "Confirm"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingRotate(true)}
            className="rounded-full border border-orange-bright/40 px-4 py-1.5 text-base text-orange-bright transition-colors hover:bg-orange-bright/10"
          >
            Change code
          </button>
        )}
      </div>

      {isConfirmingRotate && (
        <p className="text-base text-grey">
          The old code stops working. Students who already joined stay in the
          class — only new joins need the new code.
        </p>
      )}
    </div>
  );
};
