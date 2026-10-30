"use client";

import { useRef, useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { supabase } from "./shared";

// Log out button that asks "Are you sure?" first (used on the client dashboard and the admin panel).
export default function LogoutButton({ className, children }) {
  const dialog = useRef(null);
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <>
      <button type="button" className={className} aria-label="Log out" title="Log out" onClick={() => dialog.current.showModal()}>{children}</button>
      <dialog className="confirm" ref={dialog} aria-labelledby="logout-title" onClick={(event) => event.target === event.currentTarget && !leaving && dialog.current.close()}>
        <div className="confirm-body">
          <span className="confirm-icon"><LogOut size={22} /></span>
          <h2 id="logout-title">Log out</h2>
          <p>Are you sure you want to log out?</p>
          <div className="confirm-actions">
            <button type="button" className="button confirm-cancel" disabled={leaving} onClick={() => dialog.current.close()} autoFocus>Cancel</button>
            <button type="button" className="button button-dark confirm-ok" disabled={leaving} onClick={logout}>
              {leaving ? <><LoaderCircle size={16} className="spin" /> Logging out…</> : "Log out"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
