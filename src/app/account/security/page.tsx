import AccountPageShell from "@/components/account/AccountPageShell";
import PasswordSettingsForm from "@/components/account/PasswordSettingsForm";

export default function AccountSecurityPage() {
  return (
    <AccountPageShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Mon compte
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Modifier mon mot de passe
          </h1>

          <p className="mt-2 text-sm leading-7 text-blue-50">
            Mettez à jour le mot de passe de connexion à votre compte.
          </p>
        </section>

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
          <PasswordSettingsForm />
        </section>
      </div>
    </AccountPageShell>
  );
}