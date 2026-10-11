import { useState } from "react"

type IconName = "arrow" | "check" | "clock" | "eye" | "file" | "heart" | "lock" | "mic" | "qr" | "scan" | "shield" | "spark" | "user" | "x"

const paths: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5M10 13h5M10 17h5" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="15" width="6" height="6" rx="1" />
      <path d="M15 15h2v2h-2zM19 15h2v6h-6v-2M15 19v2" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M7 12h10" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3 7.8 7.5 9.5 4.5-1.7 7.5-4.9 7.5-9.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4z" />
      <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  x: (
    <>
      <path d="m7 7 10 10M17 7 7 17" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const features = [
  {
    icon: "eye" as IconName,
    title: "See before you share",
    text: "Preview exactly what a provider is requesting before access is granted.",
  },
  {
    icon: "clock" as IconName,
    title: "Access that expires",
    text: "Choose one visit, 24 hours, or 7 days. Access closes automatically.",
  },
  {
    icon: "lock" as IconName,
    title: "Revoke in real time",
    text: "One tap destroys the session key and immediately ends provider access.",
  },
  {
    icon: "mic" as IconName,
    title: "Consent in your language",
    text: "Voice-enabled consent in Telugu, Hindi, or English, with a clear receipt.",
  },
]

const recordItems = [
  { label: "Allergies & alerts", detail: "Penicillin allergy", color: "coral" },
  {
    label: "Current medicines",
    detail: "3 active prescriptions",
    color: "mint",
  },
  { label: "Recent lab reports", detail: "Last updated 14 Jun", color: "blue" },
  {
    label: "Medical history",
    detail: "Visits, diagnoses & notes",
    color: "violet",
  },
]

export default function App() {
  const [consent, setConsent] = useState<"pending" | "approved" | "revoked">(
    "pending",
  )
  const [selected, setSelected] = useState([true, true, true, false])

  const toggleRecord = (index: number) => {
    setSelected((current) =>
      current.map((item, i) => (i === index ? !item : item)),
    )
    if (consent !== "pending") setConsent("pending")
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f6] text-[#102b2c]">
      <nav className="relative z-30 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 md:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="Corex home">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#123d3b] text-[#bff46d] shadow-[0_8px_24px_rgba(18,61,59,.18)]">
            <Icon name="heart" size={20} />
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.04em]">
            COREX
          </span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#46605e] md:flex">
          <a className="transition hover:text-[#102b2c]" href="#how">
            How it works
          </a>
          <a className="transition hover:text-[#102b2c]" href="#features">
            Why COREX
          </a>
          <a className="transition hover:text-[#102b2c]" href="#security">
            Security
          </a>
        </div>
        <a href="#demo" className="button-dark hidden sm:flex">
          View demo <Icon name="arrow" size={17} />
        </a>
      </nav>

      <section className="relative mx-auto max-w-[1360px] px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-16">
        <div className="hero-glow" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 lg:grid-cols-[.95fr_1.05fr]">
          <div className="relative z-10">
            <div className="eyebrow mb-7">
              <span className="pulse-dot" /> Your health. Your permission.
            </div>
            <h1 className="max-w-[680px] text-[clamp(3.4rem,7.4vw,6.9rem)] font-extrabold leading-[.87] tracking-[-0.075em] text-[#102b2c]">
              One record.
              <br />
              <span className="relative inline-block text-[#177e71]">
                Your rules.
                <svg
                  className="absolute -bottom-3 left-1 w-[94%]"
                  viewBox="0 0 360 16"
                  fill="none"
                >
                  <path
                    d="M3 11C95 1 216 4 357 7"
                    stroke="#ff795f"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-9 max-w-[570px] text-lg leading-8 text-[#526765] md:text-xl">
              A patient-held health record that brings your medical history
              together—and puts you in control of who sees it, for how long.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="button-primary">
                Experience COREX <Icon name="arrow" size={19} />
              </a>
              <a href="#how" className="button-ghost">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white">
                  <Icon name="scan" size={15} />
                </span>{" "}
                See how it works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-bold uppercase tracking-[.13em] text-[#647774]">
              <span className="flex items-center gap-2">
                <Icon name="shield" size={16} /> Encrypted
              </span>
              <span className="flex items-center gap-2">
                <Icon name="clock" size={16} /> Time-bound
              </span>
              <span className="flex items-center gap-2">
                <Icon name="user" size={16} /> Patient-controlled
              </span>
            </div>
          </div>

          <div id="demo" className="relative mx-auto w-full max-w-[610px]">
            <div className="absolute -left-12 top-20 h-36 w-36 rounded-full bg-[#ff826a]/25 blur-3xl" />
            <div className="absolute -right-6 bottom-12 h-48 w-48 rounded-full bg-[#bff46d]/30 blur-3xl" />
            <div className="dashboard-shell relative">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#bff46d]" />
                  <span className="text-xs font-bold tracking-[.12em] text-white/65">
                    LIVE CONSENT REQUEST
                  </span>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/70">
                  SECURE SESSION
                </span>
              </div>
              <div className="grid md:grid-cols-[.86fr_1.14fr]">
                <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden bg-[#174945] p-6 text-white md:min-h-[485px]">
                  <div className="qr-grid absolute inset-0 opacity-[.07]" />
                  <div className="relative">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#bff46d] text-[#123d3b]">
                      <Icon name="scan" size={23} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-white/50">
                      Request from
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-[-.04em]">
                      Dr. Ananya Rao
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      Sanjeevani Family Clinic
                    </p>
                  </div>
                  <div className="relative mt-8 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                        <Icon name="clock" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                          Access duration
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          This visit only
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8a9b98]">
                        Sharing as
                      </p>
                      <p className="mt-1 font-bold">Meera Reddy</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0ec] font-bold text-[#d95d45]">
                      MR
                    </div>
                  </div>
                  {consent === "approved" ? (
                    <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                      <div className="success-ring mb-6">
                        <Icon name="check" size={30} />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-[-.04em]">
                        Access approved
                      </h3>
                      <p className="mt-2 max-w-[250px] text-sm leading-6 text-[#6d7d7b]">
                        Dr. Rao can now view the selected records for this
                        visit.
                      </p>
                      <button
                        onClick={() => setConsent("revoked")}
                        className="mt-7 rounded-xl border border-[#ef6b55]/25 bg-[#fff5f2] px-5 py-3 text-sm font-bold text-[#cb4f3b] transition hover:bg-[#ffe8e2]"
                      >
                        Revoke access
                      </button>
                    </div>
                  ) : consent === "revoked" ? (
                    <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                      <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#fff0ec] text-[#e05f48]">
                        <Icon name="lock" size={27} />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-[-.04em]">
                        Access revoked
                      </h3>
                      <p className="mt-2 max-w-[260px] text-sm leading-6 text-[#6d7d7b]">
                        The session key was destroyed. Your records are no
                        longer visible.
                      </p>
                      <button
                        onClick={() => setConsent("pending")}
                        className="mt-7 text-sm font-bold text-[#177e71]"
                      >
                        Review request again
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 mt-6 text-sm font-extrabold">
                        Choose what to share
                      </p>
                      <div className="space-y-2">
                        {recordItems.map((item, index) => (
                          <button
                            key={item.label}
                            onClick={() => toggleRecord(index)}
                            className={`record-row w-full ${
                              selected[index] ? "selected" : ""
                            }`}
                          >
                            <span className={`record-dot ${item.color}`} />
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-xs font-bold">
                                {item.label}
                              </span>
                              <span className="block truncate text-[10px] text-[#8a9997]">
                                {item.detail}
                              </span>
                            </span>
                            <span
                              className={`check-box ${
                                selected[index] ? "active" : ""
                              }`}
                            >
                              {selected[index] && (
                                <Icon name="check" size={12} />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setConsent("approved")}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#bff46d] py-3.5 text-sm font-extrabold text-[#163f3b] shadow-[0_8px_20px_rgba(127,176,54,.22)] transition hover:-translate-y-0.5 hover:bg-[#caff78]"
                      >
                        Approve secure access <Icon name="arrow" size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="floating-note -bottom-7 -left-3 md:-left-14">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8ffd0] text-[#28634f]">
                <Icon name="shield" size={18} />
              </span>
              <div>
                <b>Fully auditable</b>
                <small>Every access is logged</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#102f2e] px-5 py-7 text-white md:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <p className="font-semibold text-white/65">
            Built for every point of care
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-bold">
            {[
              "Primary health centres",
              "Private clinics",
              "Labs",
              "District hospitals",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#bff46d]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <div className="eyebrow mb-5">One simple handshake</div>
              <h2 className="section-title">
                Care moves fast.
                <br />
                <span>Consent should too.</span>
              </h2>
            </div>
            <p className="max-w-[500px] text-lg leading-8 text-[#647774] md:justify-self-end">
              No complicated portals, forgotten passwords, or app downloads.
              COREX makes secure sharing feel effortless for patients and
              providers.
            </p>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: "qr" as IconName,
                title: "Scan the patient QR",
                text: "A provider scans the patient's health identity to start a secure request.",
              },
              {
                n: "02",
                icon: "eye" as IconName,
                title: "Choose & approve",
                text: "The patient previews the request, selects records, and sets a time limit.",
              },
              {
                n: "03",
                icon: "heart" as IconName,
                title: "Care with context",
                text: "The provider sees a clear clinical summary—then access expires automatically.",
              },
            ].map((step, index) => (
              <article
                key={step.n}
                className={`step-card ${index === 1 ? "featured" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="step-number">{step.n}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f1ed] text-[#177e71]">
                    <Icon name={step.icon} size={22} />
                  </span>
                </div>
                <h3 className="mt-12 text-xl font-extrabold tracking-[-.035em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7d7a]">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-16 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="eyebrow mb-5">Designed around dignity</div>
            <h2 className="section-title">
              Privacy that feels
              <br />
              <span>human.</span>
            </h2>
            <p className="mt-6 max-w-[440px] text-lg leading-8 text-[#647774]">
              Consent isn't a checkbox hidden in settings. It's a clear, active
              decision the patient can understand and control.
            </p>
            <div className="photo-card mt-10">
              <img
                src="https://images.unsplash.com/photo-1758691462743-f9fc9e430d39?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=620"
                alt="Doctor reviewing information during a patient consultation"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102f2e]/75 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                <span className="text-sm font-bold">
                  Less searching. More caring.
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <Icon name="heart" size={18} />
                </span>
              </div>
            </div>
          </div>
          <div className="grid content-start gap-px overflow-hidden rounded-[28px] border border-[#dfe8e4] bg-[#dfe8e4] sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="min-h-[250px] bg-[#f8faf9] p-8 transition duration-300 hover:bg-[#f0f7f2] md:p-10"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#177e71] shadow-[0_8px_24px_rgba(16,47,46,.07)]">
                  <Icon name={feature.icon} size={22} />
                </span>
                <h3 className="mt-9 text-xl font-extrabold tracking-[-.035em]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7d7a]">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[36px] bg-[#123d3b] text-white shadow-[0_30px_80px_rgba(16,47,46,.16)]">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#bff46d]">
                <Icon name="spark" size={15} /> SECURITY BY DESIGN
              </span>
              <h2 className="mt-7 max-w-[560px] text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl">
                When access ends,
                <br />
                the key disappears.
              </h2>
              <p className="mt-6 max-w-[550px] text-base leading-7 text-white/60">
                COREX uses session-specific encryption keys. Revoke access and
                the key is destroyed—making protected session data unreadable,
                not just hidden.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                {[
                  "AES encryption",
                  "Scope-based access",
                  "Automatic expiry",
                  "Tamper-proof audit",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/75"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="security-visual relative min-h-[400px] overflow-hidden bg-[#0c302f]">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative grid h-32 w-32 place-items-center rounded-[38px] bg-[#bff46d] text-[#123d3b] shadow-[0_0_80px_rgba(191,244,109,.25)]">
                  <Icon name="lock" size={44} />
                  <span className="absolute -right-8 -top-5 rounded-full bg-[#ff795f] px-3 py-2 text-[10px] font-extrabold text-white shadow-lg">
                    REVOKED
                  </span>
                </div>
              </div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between text-[10px] font-bold uppercase tracking-[.15em] text-white/35">
                <span>Session #8F2A</span>
                <span>Key destroyed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 pb-8 md:px-8">
        <div className="mx-auto max-w-[1180px] rounded-[30px] bg-[#e6f0ea] px-7 py-10 md:px-12">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              <a href="#" className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#123d3b] text-[#bff46d]">
                  <Icon name="heart" size={18} />
                </span>
                <span className="text-xl font-extrabold tracking-[-.04em]">
                  COREX
                </span>
              </a>
              <p className="mt-5 max-w-[400px] text-sm leading-6 text-[#607370]">
                Connected records. Informed care. Patient-controlled privacy.
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-bold">
                A healthcare innovation by Team COREX
              </p>
              <p className="mt-2 text-xs text-[#71817f]">
                Anurag University · Built for equitable digital health
              </p>
            </div>
          </div>
          <div className="mt-9 border-t border-[#102f2e]/10 pt-6 text-xs text-[#71817f]">
            Concept prototype · Synthetic data shown for demonstration only
          </div>
        </div>
      </footer>
    </main>
  )
}
