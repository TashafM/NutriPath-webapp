"use client";

import { useState } from "react";
import { CalendarCheck, CircleCheck, Clock, LoaderCircle, Target, X } from "lucide-react";
import { SESSION_TIMES } from "./plans";
import Select from "./select";

const EMPTY = { name: "", phone: "", email: "", goal: "", preferred_time: "", message: "", company: "" };

// One dialog for every "Book a free session" button; open it with dialogRef.current.showModal().
export default function BookSessionDialog({ dialogRef, plans }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  // Wrong first digit shows right away; a short number only after leaving the field.
  const phoneInvalid = /^[0-5]/.test(form.phone) || (phoneTouched && form.phone.length > 0 && form.phone.length < 10);
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const close = () => {
    dialogRef.current.close();
    if (status === "sent") {
      setForm(EMPTY);
      setPhoneTouched(false);
      setStatus("idle");
    }
  };

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("sending");
    const res = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, phone: `+91${form.phone}` }) }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setStatus("idle");
      return setError(body?.error || "Something went wrong. Please try again.");
    }
    setStatus("sent");
  }

  return (
    <dialog className="booking" ref={dialogRef} aria-labelledby="booking-title" onClick={(event) => event.target === event.currentTarget && close()} onClose={close}>
      <div className="booking-body">
        <button type="button" className="booking-close" aria-label="Close" onClick={close}><X size={18} /></button>

        {status === "sent" ? (
          <div className="booking-done">
            <CircleCheck size={44} strokeWidth={1.5} />
            <h2 id="booking-title">You’re booked <em>in.</em></h2>
            <p>Thanks, {form.name.split(" ")[0]}! We’ll call you on +91 {form.phone} to set up your free session.</p>
            <button type="button" className="button button-dark booking-submit" onClick={close}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="booking-form">
            <div className="booking-head">
              <span className="booking-icon"><CalendarCheck size={22} /></span>
              <div>
                <h2 id="booking-title">Book a free <em>session.</em></h2>
                <p className="booking-lead">Tell us a little about you. We’ll call to find a time that suits you.</p>
              </div>
            </div>

            <div className="booking-row">
              <label><span className="field-label">Name <b className="required" aria-hidden="true">*</b></span><input required maxLength={80} autoComplete="name" value={form.name} onChange={set("name")} placeholder="Your name" /></label>
              <label><span className="field-label">Phone <b className="required" aria-hidden="true">*</b></span>
                <span className={phoneInvalid ? "phone-input is-invalid" : "phone-input"}>
                  <span className="phone-prefix" aria-hidden="true">+91</span>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    title="10-digit mobile number starting with 6, 7, 8 or 9"
                    aria-label="Phone, 10-digit mobile number after +91"
                    aria-invalid={phoneInvalid}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    onBlur={() => setPhoneTouched(true)}
                    placeholder="98765 43210"
                  />
                </span>
                {phoneInvalid && <small className="field-error">{/^[0-5]/.test(form.phone) ? "Mobile numbers start with 6, 7, 8 or 9" : "Enter all 10 digits"}</small>}
              </label>
            </div>
            <label>Email<input type="email" maxLength={120} autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" /></label>
            <div className="booking-row">
              <Select label="Goal" icon={Target} value={form.goal} onChange={(goal) => setForm({ ...form, goal })} placeholder="Not sure yet"
                options={[{ value: "", label: "Not sure yet" }, ...plans.map((plan) => ({ value: plan.title, label: plan.title }))]} />
              <Select label="Best time to call" icon={Clock} value={form.preferred_time} onChange={(preferred_time) => setForm({ ...form, preferred_time })} placeholder="Any time"
                options={[{ value: "", label: "Any time" }, ...SESSION_TIMES.map((time) => ({ value: time, label: time }))]} />
            </div>
            <label>Anything we should know?<textarea rows={2} maxLength={500} value={form.message} onChange={set("message")} placeholder="Health conditions, food preferences, routine…" /></label>
            {/* Hidden from people; bots tend to fill it in. */}
            <input className="booking-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.company} onChange={set("company")} />

            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="button button-dark booking-submit" disabled={status === "sending"}>
              {status === "sending" ? <><LoaderCircle size={16} className="spin" /> Booking…</> : "Book my free session"}
            </button>
            <p className="booking-note">No payment needed. We’ll never share your details.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
