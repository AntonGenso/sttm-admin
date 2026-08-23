import { LoginForm } from "../uikit/LoginForm";
import { LanguageSwitcher } from "../uikit/LanguageSwitcher";

export default function LoginPage() {
  return (
    <section className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <LoginForm />
    </section>
  );
}
