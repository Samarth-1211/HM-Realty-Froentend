import { ShieldCheckIcon } from 'lucide-react'
import { APP_FULL_NAME, APP_LEGAL_NAME } from '@/lib/constants'

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What we collect',
    body: 'Account details (name, email, phone, role), lead and client information entered or imported by your organization, messages sent through connected integrations such as WhatsApp, attendance records, and basic usage logs needed to keep the service secure.',
  },
  {
    title: 'How we use it',
    body: 'Solely to operate the CRM: managing leads, teams, follow-ups, reports and communication. We do not sell your data or use it for advertising.',
  },
  {
    title: 'Sharing',
    body: 'Data is visible only to authorized users within your organization according to their role. It is shared with third-party services (e.g. hosting, messaging providers) only as required to run the features you enable, or when required by law.',
  },
  {
    title: 'Security & retention',
    body: 'Data is encrypted in transit, access is role-restricted, and passwords are stored hashed. We retain data for as long as your organization’s account is active or as required by law.',
  },
  {
    title: 'Your rights',
    body: 'You may request access to, correction of, or deletion of your personal data by contacting your organization’s administrator or us directly.',
  },
]

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-slate-50 px-6 py-12">
      <article className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Last updated: October 2026</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600">
          {APP_FULL_NAME} is operated by {APP_LEGAL_NAME}. This policy explains what data we handle
          and how we protect it.
        </p>
        <div className="space-y-5">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">{s.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-500">
          We may update this policy from time to time; changes take effect when posted here.
        </p>
      </article>
    </div>
  )
}
