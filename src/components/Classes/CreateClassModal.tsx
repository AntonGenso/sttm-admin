import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import axios from "axios";
import { createClass } from "../../api/classes";
import { getCities, getSchools } from "../../api/dictionaries";
import {
  CLASS_GRADES,
  CYRILLIC_LETTERS,
  LATIN_LETTERS,
} from "../../types/classes";
import type { IClass } from "../../types/classes";

type Inputs = {
  cityId: string;
  schoolName: string;
  grade: string;
  letter: string;
};

interface Props {
  onClose: () => void;
  onCreated?: (created: IClass) => void;
}

const fieldClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

const labelClass =
  "font-mono text-xs uppercase tracking-widest text-cyan-bright";

export const CreateClassModal = ({ onClose, onCreated }: Props) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { cityId: "", schoolName: "", grade: "", letter: "" },
  });

  const cityId = watch("cityId");

  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
    staleTime: Infinity,
  });

  // Suggestions only make sense once a city is picked: schools are unique per city.
  const { data: schools } = useQuery({
    queryKey: ["schools", cityId],
    queryFn: () => getSchools(Number(cityId)),
    enabled: Boolean(cityId),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: createClass,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["classes", "my"] });
      queryClient.invalidateQueries({ queryKey: ["schools", cityId] });
      onCreated?.(created);
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) =>
    mutate({
      cityId: Number(values.cityId),
      schoolName: values.schoolName.trim(),
      grade: Number(values.grade),
      letter: values.letter,
    });

  const serverMessage = axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ??
      "Could not create the class")
    : error
      ? "Could not create the class"
      : null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[520px] flex-col gap-5 rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">New class</h2>
          <p className="mt-1 text-lg text-grey">
            A 7-character join code is generated once the class is created.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>City</span>
          <select
            className={fieldClass}
            defaultValue=""
            disabled={isCitiesLoading}
            {...register("cityId", { required: "Select a city" })}
          >
            <option value="" disabled>
              {isCitiesLoading ? "Loading..." : "Select a city"}
            </option>
            {cities?.map((city) => (
              <option key={city.id} value={city.id} className="bg-bg-deep">
                {city.name_ru}
              </option>
            ))}
          </select>
          {errors.cityId && (
            <span className="text-sm text-error">{errors.cityId.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>School</span>
          <input
            list="school-suggestions"
            placeholder="e.g. Школа №12"
            autoComplete="off"
            className={fieldClass}
            {...register("schoolName", {
              required: "Enter the school name or number",
              maxLength: { value: 255, message: "Name is too long" },
            })}
          />
          {/* Picking an existing name keeps one school from being created twice. */}
          <datalist id="school-suggestions">
            {schools?.map((school) => (
              <option key={school.id} value={school.name} />
            ))}
          </datalist>
          {errors.schoolName && (
            <span className="text-sm text-error">
              {errors.schoolName.message}
            </span>
          )}
        </label>

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>Grade</span>
            <select
              className={fieldClass}
              defaultValue=""
              {...register("grade", { required: "Select a grade" })}
            >
              <option value="" disabled>
                Grade
              </option>
              {CLASS_GRADES.map((grade) => (
                <option key={grade} value={grade} className="bg-bg-deep">
                  {grade}
                </option>
              ))}
            </select>
            {errors.grade && (
              <span className="text-sm text-error">{errors.grade.message}</span>
            )}
          </label>

          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>Letter</span>
            <select
              className={fieldClass}
              defaultValue=""
              {...register("letter", { required: "Select a letter" })}
            >
              <option value="" disabled>
                Letter
              </option>
              <optgroup label="А — Д">
                {CYRILLIC_LETTERS.map((letter) => (
                  <option
                    key={`cyr-${letter}`}
                    value={letter}
                    className="bg-bg-deep"
                  >
                    {letter}
                  </option>
                ))}
              </optgroup>
              <optgroup label="A — G">
                {LATIN_LETTERS.map((letter) => (
                  <option
                    key={`lat-${letter}`}
                    value={letter}
                    className="bg-bg-deep"
                  >
                    {letter}
                  </option>
                ))}
              </optgroup>
            </select>
            {errors.letter && (
              <span className="text-sm text-error">
                {errors.letter.message}
              </span>
            )}
          </label>
        </div>

        {serverMessage && (
          <span className="text-base text-error">{serverMessage}</span>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-5 py-2 text-lg text-grey transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create class"}
          </button>
        </div>
      </form>
    </div>
  );
};
