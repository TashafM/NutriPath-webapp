"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, KeyRound, LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../shared";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const RESEND_SECONDS = 60;

// Only same-site paths, so ?next= can't send users to another domain.
const nextPath = () => {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState("");
  const [adminLogin, setAdminLogin] = useState(false);

  // Already logged in: skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) return window.location.replace(nextPath());
      setAdminLogin(nextPath().startsWith("/admin"));
    });
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // Load Google's sign-in script early: the popup must open straight from the click, or browsers block it.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || document.getElementById("google-gsi")) return;
    const script = Object.assign(document.createElement("script"), { id: "google-gsi", src: "https://accounts.google.com/gsi/client", async: true });
    document.head.appendChild(script);
  }, []);

  function google() {
    // Without our own client ID, fall back to Supabase's redirect (Google then shows the supabase.co address).
    if (!GOOGLE_CLIENT_ID) return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (!window.google?.accounts?.oauth2) return setError("Google sign-in is still loading. Please try again.");
    setError("");
    // Popup flow: Google's screen shows our own domain, not supabase.co.
    window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async ({ code, error: popupError }) => {
        if (popupError || !code) return setError("Google sign-in was cancelled.");
        setLoading(true);
        const res = await fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
        const body = await res.json().catch(() => ({}));
        const { error: signInError } = res.ok ? await supabase.auth.signInWithIdToken({ provider: "google", token: body.idToken }) : { error: { message: body.error } };
        if (signInError) {
          setLoading(false);
          return setError(signInError.message || "Google sign-in failed. Please try again.");
        }
        window.location.assign("/dashboard");
      },
    }).requestCode();
  }

  async function sendCode() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) return setError(error.message);
    setCodeSent(true);
    setResendIn(RESEND_SECONDS);
  }

  async function submit(event) {
    event.preventDefault();
    if (!codeSent) return sendCode();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    window.location.assign(nextPath());
  }

  return (
    <main className="auth">
      <aside className="auth-brand">
        <Link className="auth-brand-logo" href="/" aria-label="The NutriPath home"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} priority /></Link>
        <div className="auth-brand-copy">
          <h2>Your plan, your progress, <em>all in one place.</em></h2>
          <ul>
            {["Your personalised plans and payments", "See when each plan is due for renewal", "Stay on track with regular follow-ups"].map((item) => <li key={item}><CircleCheck size={18} />{item}</li>)}
          </ul>
        </div>
        <figure className="auth-quote">
          <blockquote>“You don’t need to do everything differently. You just need a place to begin.”</blockquote>
          <figcaption>The NutriPath</figcaption>
        </figure>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-top">
            <Link className="auth-back" href="/" aria-label="Back to website"><ArrowLeft size={15} /> <span>Back to website</span></Link>
            <Link className="auth-logo-mobile" href="/" aria-label="The NutriPath home"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} priority /></Link>
          </div>
          {adminLogin && <span className="auth-badge"><ShieldCheck size={13} /> ADMIN LOGIN</span>}
          <h1>{codeSent ? <>Check your <em>inbox.</em></> : <>Welcome <em>back.</em></>}</h1>
          <p className="auth-lead">{codeSent ? <>We sent a login code to <strong>{email}</strong>. <button type="button" className="account-link" onClick={() => { setCodeSent(false); setCode(""); setError(""); }}>Change email</button></> : "Log in with your email or Google account. No password needed."}</p>

          <form onSubmit={submit} className="auth-form">
            {!codeSent ? (
              <label className="auth-field">
                <span>Email address</span>
                <span className="auth-input"><Mail size={17} /><input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></span>
              </label>
            ) : (
              <label className="auth-field">
                <span>Login code</span>
                <span className="auth-input"><KeyRound size={17} /><input className="auth-code" inputMode="numeric" minLength={6} maxLength={10} required placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" /></span>
              </label>
            )}
            <button type="submit" className="button button-dark auth-submit" disabled={loading}>
              {loading ? <><LoaderCircle size={16} className="spin" /> {codeSent ? "Verifying…" : "Sending code…"}</> : codeSent ? <>Verify &amp; log in <ArrowRight size={16} /></> : <>Email me a code <ArrowRight size={16} /></>}
            </button>
            {codeSent && (
              <p className="account-resend">
                {resendIn > 0 ? `Resend code in 0:${String(resendIn).padStart(2, "0")}` : <>Didn’t get it? <button type="button" className="account-link" onClick={sendCode} disabled={loading}>Resend code</button></>}
              </p>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
          </form>

          {!codeSent && (
            <>
              <div className="auth-divider"><span>or</span></div>
              <button type="button" className="account-google" onClick={google} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
                Continue with Google
              </button>
            </>
          )}

          <p className="auth-foot"><Lock size={13} /> Secure login. We never share your email.</p>
        </div>
      </section>
    </main>
  );
}
