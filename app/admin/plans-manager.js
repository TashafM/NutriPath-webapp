"use client";

import { useRef, useState } from "react";
import { EyeOff, GripVertical, ImageUp, LoaderCircle, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { discountPercent, hasDiscount, MAX_FEATURED, PLAN_ICONS } from "../plans";
import { supabase } from "../shared";

const EMPTY = { title: "", tag: "", description: "", features: [], amount: "", original_amount: "", period: "month", image: "", image_alt: "", icon: "Leaf", featured: false, popular: false, published: true };

const rupees = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

// Fresh token per request: the admin page can stay open longer than one access token lasts.
async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token}` };
}

const MAX_UPLOAD_MB = 10;

// Upload straight to Cloudinary with a server signature, then return a URL that crops and
// sizes the photo for plan cards (16:10, 1200×750, auto format/quality, smart focus).
async function uploadImage(file) {
  const res = await fetch("/api/admin/upload", { method: "POST", headers: await authHeader() });
  const sign = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(sign.error || "Could not start the upload");
  const form = new FormData();
  form.append("file", file);
  for (const key of ["api_key", "timestamp", "signature", "folder", "transformation"]) form.append(key, key === "api_key" ? sign.apiKey : sign[key]);
  const upload = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: form });
  const body = await upload.json().catch(() => ({}));
  if (!upload.ok) throw new Error(body.error?.message || "Upload failed");
  return body.secure_url.replace("/image/upload/", "/image/upload/c_fill,g_auto,w_1200,h_750,f_auto,q_auto/");
}

export default function PlansManager({ plans, setPlans }) {
  const [editing, setEditing] = useState(null); // plan being edited, or EMPTY for a new one
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState(null);
  const dragging = useRef(null);

  const featured = plans.filter((plan) => plan.featured);
  const more = plans.filter((plan) => !plan.featured);
  const starsFull = featured.length >= MAX_FEATURED;

  async function save(plan) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/plans", {
      method: plan.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(plan),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(body.error || "Could not save the plan");
      return false;
    }
    setPlans((list) => (plan.id ? list.map((item) => (item.id === plan.id ? body.plan : item)) : [...list, body.plan]).sort((a, b) => a.sort - b.sort || a.id - b.id));
    return true;
  }

  async function remove(plan) {
    if (!window.confirm(`Delete "${plan.title}"? It will disappear from the website. Past payments for it are kept.`)) return;
    const res = await fetch(`/api/admin/plans?id=${plan.id}`, { method: "DELETE", headers: await authHeader() });
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error || "Could not delete the plan");
    setPlans((list) => list.filter((item) => item.id !== plan.id));
  }

  const toggleStar = (plan) => save({ ...plan, featured: !plan.featured });

  // Reorder inside one group (top plans or more programs), then renumber sort for everything shown.
  function move(id, toId) {
    if (id === toId) return plans;
    const group = plans.find((plan) => plan.id === id).featured;
    if (plans.find((plan) => plan.id === toId)?.featured !== group) return plans;
    const list = plans.filter((plan) => plan.featured === group);
    const from = list.findIndex((plan) => plan.id === id);
    const to = list.findIndex((plan) => plan.id === toId);
    list.splice(to, 0, ...list.splice(from, 1));
    const ordered = group ? [...list, ...plans.filter((plan) => !plan.featured)] : [...plans.filter((plan) => plan.featured), ...list];
    const next = ordered.map((plan, index) => ({ ...plan, sort: (index + 1) * 10 }));
    setPlans(next);
    return next;
  }

  async function saveOrder(list) {
    setError("");
    const res = await fetch("/api/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(list.map(({ id, sort }) => ({ id, sort }))),
    });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || "Could not save the new order");
  }

  // Drag by the grip with mouse, finger or pen (pointer events cover all three; the native
  // HTML drag-and-drop API does not fire on touch screens).
  function startDrag(event, plan) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { id: plan.id, list: plans, moved: false };
    setDragId(plan.id);
  }

  function dragMove(event) {
    const drag = dragging.current;
    if (!drag) return;
    const over = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-plan-id]");
    const toId = Number(over?.dataset.planId);
    if (!toId || toId === drag.id) return;
    const next = move(drag.id, toId);
    if (next !== plans) Object.assign(drag, { list: next, moved: true });
  }

  function endDrag() {
    const drag = dragging.current;
    dragging.current = null;
    setDragId(null);
    if (drag?.moved) saveOrder(drag.list);
  }

  // Keyboard fallback for dragging: arrow keys on the grip handle.
  function nudge(event, plan, group) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const index = group.findIndex((item) => item.id === plan.id);
    const target = group[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (target) saveOrder(move(plan.id, target.id));
  }

  async function submit(event) {
    event.preventDefault();
    if (await save({ ...editing, features: editing.featuresText.split("\n") })) setEditing(null);
  }

  async function pickImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Image must be under ${MAX_UPLOAD_MB} MB`);
    setError("");
    setUploading(true);
    try {
      const image = await uploadImage(file);
      setEditing((current) => ({ ...current, image }));
    } catch (uploadError) {
      setError(uploadError.message);
    }
    setUploading(false);
  }

  const openForm = (plan) => {
    setError("");
    setEditing({ ...plan, featuresText: plan.features.join("\n") });
  };

  const row = (plan, _index, group) => {
    const starDisabled = !plan.featured && starsFull;
    return (
      <li
        className={dragId === plan.id ? "plan-row is-dragging" : "plan-row"}
        key={plan.id}
        data-plan-id={plan.id}
      >
        <button
          type="button"
          className="plan-grip"
          aria-label={`Reorder ${plan.title}: use arrow up or down`}
          title="Drag to reorder"
          onKeyDown={(event) => nudge(event, plan, group)}
          onPointerDown={(event) => startDrag(event, plan)}
          onPointerMove={dragMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <GripVertical size={18} />
        </button>
        <button
          type="button"
          className={plan.featured ? "plan-star is-on" : "plan-star"}
          disabled={starDisabled || saving}
          title={plan.featured ? "Remove from top plans" : starDisabled ? `Only ${MAX_FEATURED} plans can be starred` : "Show in top plans"}
          aria-label={plan.featured ? `Unstar ${plan.title}` : `Star ${plan.title}`}
          onClick={() => toggleStar(plan)}
        >
          <Star size={18} />
        </button>
        {plan.image ? <img className="plan-row-thumb" src={plan.image} alt="" /> : <span className="plan-row-thumb plan-row-thumb-empty" />}
        <div className="plan-row-main">
          <strong>{plan.title}</strong>
          <span className="admin-sub">
            {hasDiscount(plan) && <><s>{rupees(plan.original_amount)}</s>{" "}</>}{rupees(plan.amount)} / {plan.period === "session" ? "session" : "month"}{hasDiscount(plan) ? ` · ${discountPercent(plan)}% off` : ""}
            {plan.tag ? ` · ${plan.tag}` : ""}
          </span>
        </div>
        <div className="plan-row-badges">
          {plan.popular && <span className="dash-pill">Most popular</span>}
          {!plan.published && <span className="dash-pill dash-pill-muted"><EyeOff size={11} /> Hidden</span>}
        </div>
        <button type="button" className="plan-row-action" onClick={() => openForm(plan)}><Pencil size={15} /> Edit</button>
        <button type="button" className="plan-row-action plan-row-delete" aria-label={`Delete ${plan.title}`} onClick={() => remove(plan)}><Trash2 size={15} /></button>
      </li>
    );
  };

  return (
    <>
      <div className="plans-intro">
        <p className="admin-sub">Star a plan to show it as a big photo card at the top of the website (max {MAX_FEATURED}). Everything else appears under “More programs”. Drag the ⋮⋮ handle to change the order.</p>
        <button type="button" className="button button-dark plan-buy" onClick={() => openForm(EMPTY)}><Plus size={16} /> Add plan</button>
      </div>
      {error && !editing && <p className="account-error">{error}</p>}

      <section className="admin-card">
        <div className="admin-card-head"><h2>Top plans</h2><span className={starsFull ? "dash-pill" : "dash-pill dash-pill-muted"}><Star size={11} /> {featured.length} / {MAX_FEATURED}</span></div>
        {featured.length ? <ul className="plan-rows">{featured.map(row)}</ul> : <p className="admin-sub">No starred plans yet. Star up to {MAX_FEATURED} plans below.</p>}
      </section>

      <section className="admin-card">
        <div className="admin-card-head"><h2>More programs</h2><span className="dash-pill dash-pill-muted">{more.length}</span></div>
        {more.length ? <ul className="plan-rows">{more.map(row)}</ul> : <p className="admin-sub">No other plans.</p>}
      </section>

      {editing && (
        <div className="plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-form-title" onClick={(event) => event.target === event.currentTarget && setEditing(null)}>
          <form className="plan-form" onSubmit={submit}>
            <div className="admin-card-head">
              <h2 id="plan-form-title">{editing.id ? "Edit plan" : "Add plan"}</h2>
              <button type="button" className="plan-row-action" aria-label="Close" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>

            <label>Plan name<input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Weight Loss Program" /></label>
            {editing.id && <p className="admin-sub plan-form-note">Renaming a plan doesn’t change the name on past payments.</p>}
            <div className="plan-form-row">
              <label>Selling price (₹) <span className="admin-sub">charged</span><input required type="number" min="1" step="1" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} placeholder="2999" /></label>
              <label>Real price (₹) <span className="admin-sub">shown crossed out</span><input type="number" min="1" step="1" value={editing.original_amount ?? ""} onChange={(e) => setEditing({ ...editing, original_amount: e.target.value })} placeholder="3999" /></label>
            </div>
            <div className="plan-form-row">
              <label>Billed<select value={editing.period} onChange={(e) => setEditing({ ...editing, period: e.target.value })}><option value="month">Per month</option><option value="session">Per session</option></select></label>
            </div>
            <label>Short tag<input value={editing.tag} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} placeholder="SUSTAINABLE FAT LOSS" /></label>
            <label>Description<textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="One or two lines about the plan" /></label>
            <label>What’s included <span className="admin-sub">one point per line</span><textarea rows={4} value={editing.featuresText} onChange={(e) => setEditing({ ...editing, featuresText: e.target.value })} placeholder={"Calorie deficit plans\nWeekly follow-ups"} /></label>

            <div className="plan-form-row">
              <div className="plan-image-field">
                <span className="plan-image-label">Image <span className="admin-sub">needed for top plans</span></span>
                <div className="plan-image-row">
                  {editing.image ? <img className="plan-image-preview" src={editing.image} alt="" /> : <span className="plan-image-preview plan-image-empty"><ImageUp size={20} /></span>}
                  <label className={uploading ? "button button-outline plan-upload is-busy" : "button button-outline plan-upload"}>
                    {uploading ? <><LoaderCircle size={15} className="spin" /> Uploading…</> : <><ImageUp size={15} /> {editing.image ? "Change" : "Upload"}</>}
                    <input type="file" accept="image/*" hidden disabled={uploading} onChange={pickImage} />
                  </label>
                  {editing.image && !uploading && <button type="button" className="plan-row-action plan-row-delete" aria-label="Remove image" onClick={() => setEditing({ ...editing, image: "" })}><Trash2 size={15} /></button>}
                </div>
                <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="…or paste an image link" aria-label="Image link" />
              </div>
              <label>Icon <span className="admin-sub">for More programs</span><select value={editing.icon || "Leaf"} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>{PLAN_ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
            </div>
            <label>Image description <span className="admin-sub">for screen readers</span><input value={editing.image_alt} onChange={(e) => setEditing({ ...editing, image_alt: e.target.value })} placeholder="Bowl of salad with avocado" /></label>

            <div className="plan-form-checks">
              <label><input type="checkbox" checked={editing.featured} disabled={!editing.featured && starsFull} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> <Star size={14} /> Top plan {!editing.featured && starsFull && <span className="admin-sub">(4 already starred)</span>}</label>
              <label><input type="checkbox" checked={editing.popular} onChange={(e) => setEditing({ ...editing, popular: e.target.checked })} /> “Most popular” badge</label>
              <label><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Show on website</label>
            </div>

            {error && <p className="account-error">{error}</p>}
            <div className="plan-form-actions">
              <button type="button" className="button button-outline plan-buy" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="button button-dark plan-buy" disabled={saving || uploading}>{saving ? "Saving…" : "Save plan"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
