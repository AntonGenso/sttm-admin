import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { AxiosError } from "axios";
import { loginUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { PasswordInput } from "./PasswordInput";

type Inputs = {
  name: string;
  password: string;
};

const inputClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

const labelClass =
  "mb-1.5 block font-mono text-xs uppercase tracking-widest text-cyan-bright";

export const LoginForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      navigate("/");
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({ name: values.name, password: values.password });
  });

  const serverError =
    mutation.error instanceof AxiosError
      ? ((mutation.error.response?.data as { message?: string })?.message ??
        "Something went wrong")
      : mutation.error
        ? "Something went wrong"
        : null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="w-full max-w-[360px] rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.75)] p-8 shadow-[0_0_40px_rgba(0,227,255,0.12)] backdrop-blur-xl"
    >
      <h1 className="text-center text-4xl font-bold tracking-wide text-white">
        Log in
      </h1>
      <p className="mb-7 mt-1 text-center text-base text-grey">
        Welcome back, commander
      </p>

      <div className="mb-5">
        <label className={labelClass}>Name</label>
        <input
          type="text"
          placeholder="Your callsign"
          autoComplete="username"
          className={inputClass}
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <span className="mt-1 block text-sm text-error">
            {errors.name.message}
          </span>
        )}
      </div>

      <div className="mb-5">
        <label className={labelClass}>Password</label>
        <PasswordInput
          placeholder="••••••••"
          autoComplete="current-password"
          className={inputClass}
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <span className="mt-1 block text-sm text-error">
            {errors.password.message}
          </span>
        )}
      </div>

      {serverError && (
        <p className="mb-4 text-center text-sm text-error">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] py-3 text-xl font-bold text-white transition-opacity hover:opacity-85 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? "Logging in..." : "Log in"}
      </button>

      <p className="mt-5 text-center text-base text-grey">
        Don't have an account?{" "}
        <Link to="/signin" className="text-cyan-bright hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
};
