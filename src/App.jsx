import { useState } from "react";
import { Plus, Trash2, Check, ListChecks, Search, CalendarDays } from "lucide-react";

/* ---------- ค่าคงที่ ---------- */
const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-400", active: "bg-emerald-500 text-white border-emerald-500" },
  medium: { label: "กลาง", badge: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-400", active: "bg-amber-500 text-white border-amber-500" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 border-rose-200", bar: "bg-rose-400", active: "bg-rose-500 text-white border-rose-500" },
};
const ORDER = ["low", "medium", "high"];

const CATS = {
  work: { label: "งาน", chip: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  personal: { label: "ส่วนตัว", chip: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  shopping: { label: "ช้อปปิ้ง", chip: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  health: { label: "สุขภาพ", chip: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
};
const CAT_KEYS = Object.keys(CATS);

const FILTERS = [
  ["all", "ทั้งหมด"],
  ["active", "ยังไม่เสร็จ"],
  ["completed", "เสร็จแล้ว"],
];

/* ---------- วันที่ ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toStr(d);
};
const fmt = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
const openPicker = (e) => {
  try {
    e.currentTarget.showPicker?.();
  } catch (_) {}
};

const SEED = [
  { id: 1, text: "ส่งรายงานโปรเจกต์", done: false, priority: "high", category: "work", due: addDays(-1) },
  { id: 2, text: "ตอบอีเมลลูกค้า", done: false, priority: "medium", category: "work", due: addDays(0) },
  { id: 3, text: "ซื้อของเข้าบ้าน", done: true, priority: "low", category: "shopping", due: addDays(-2) },
  { id: 4, text: "วิ่งออกกำลังกาย 30 นาที", done: false, priority: "medium", category: "health", due: addDays(2) },
  { id: 5, text: "โทรหาครอบครัว", done: false, priority: "low", category: "personal", due: "" },
];

/* ---------- กราฟโดนัท ---------- */
function Donut({ segments, total, percent }) {
  let offset = 25; // เริ่มที่ด้านบน
  return (
    <svg viewBox="0 0 36 36" className="h-24 w-24 shrink-0">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" />
      {total > 0 &&
        segments.map((s) => {
          const pct = (s.value / total) * 100;
          const el = (
            <circle
              key={s.key}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={s.color}
              strokeWidth="4"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={offset}
            />
          );
          offset -= pct;
          return el;
        })}
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="700" fill="#0f172a">
        {percent}%
      </text>
    </svg>
  );
}

export default function App() {
  const [todos, setTodos] = useState(SEED);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("work");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [nextId, setNextId] = useState(6);

  const today = todayStr();
  const isOverdue = (t) => !t.done && t.due && t.due < today;

  /* สถิติ */
  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const overdueCount = todos.filter(isOverdue).length;
  const pendingCount = total - doneCount - overdueCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const remaining = total - doneCount;
  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: doneCount, color: "#4f46e5", dot: "bg-indigo-600" },
    { key: "pending", label: "ค้างอยู่", value: pendingCount, color: "#cbd5e1", dot: "bg-slate-300" },
    { key: "overdue", label: "เลยกำหนด", value: overdueCount, color: "#ef4444", dot: "bg-red-500" },
  ];

  /* กรอง + ค้นหา */
  const q = query.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (catFilter === "all" || t.category === catFilter) &&
      (filter === "all" || (filter === "active" ? !t.done : t.done)) &&
      (!q || t.text.toLowerCase().includes(q))
  );

  const catCount = (k) => todos.filter((t) => t.category === k).length;

  /* การกระทำ */
  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [{ id: nextId, text: value, done: false, priority, category, due }, ...prev]);
    setNextId(nextId + 1);
    setText("");
    setDue("");
  };

  const onInputKey = (e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) addTodo();
  };

  const patch = (id, p) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const toggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const cyclePriority = (t) => patch(t.id, { priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] });
  const cycleCategory = (t) => patch(t.id, { category: CAT_KEYS[(CAT_KEYS.indexOf(t.category) + 1) % CAT_KEYS.length] });

  const removeWithAnimation = (ids) => {
    setTodos((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((prev) => prev.filter((t) => !ids.includes(t.id))), 300);
  };
  const clearCompleted = () => removeWithAnimation(todos.filter((t) => t.done).map((t) => t.id));

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditText(t.text);
  };
  const commitEdit = () => {
    if (editingId === null) return;
    const value = editText.trim();
    if (value) patch(editingId, { text: value });
    setEditingId(null);
  };

  const dueBadge = (t) => {
    if (!t.due) return { cls: "border-dashed border-slate-300 bg-white text-slate-400", label: "กำหนดส่ง" };
    if (t.done) return { cls: "border-slate-200 bg-slate-50 text-slate-400", label: fmt(t.due) };
    if (t.due < today) return { cls: "border-red-300 bg-red-100 text-red-700", label: `เลยกำหนด ${fmt(t.due)}` };
    if (t.due === today) return { cls: "border-yellow-300 bg-yellow-100 text-yellow-800", label: "วันนี้" };
    return { cls: "border-slate-200 bg-slate-50 text-slate-600", label: fmt(t.due) };
  };

  const emptyText = q
    ? "ไม่พบงานที่ค้นหา"
    : filter === "active"
    ? "ไม่มีงานค้าง เยี่ยมมาก!"
    : filter === "completed"
    ? "ยังไม่มีงานที่เสร็จ"
    : "ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย";

  const navItems = [
    ["all", "ทั้งหมด", todos.length, null],
    ...CAT_KEYS.map((k) => [k, CATS[k].label, catCount(k), CATS[k].dot]),
  ];

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
            <ListChecks size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จัดการงานประจำวันให้เป็นระเบียบ</p>
          </div>
        </header>

        {/* สถิติ */}
        <section className="mb-5 flex items-center gap-5 rounded-2xl bg-white p-4 shadow-md">
          <Donut segments={segments} total={total} percent={percent} />
          <div className="min-w-0 flex-1">
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold text-slate-900">{total}</div>
                <div className="text-xs text-slate-500">งานทั้งหมด</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{percent}%</div>
                <div className="text-xs text-slate-500">เสร็จแล้ว</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {segments.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label} {s.value}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="md:grid md:grid-cols-4 md:gap-5">
          {/* แถบหมวดหมู่ */}
          <aside className="mb-4 md:col-span-1 md:mb-0">
            <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-md md:flex-col">
              {navItems.map(([key, label, count, dot]) => (
                <button
                  key={key}
                  onClick={() => setCatFilter(key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:w-full ${
                    catFilter === key ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {dot ? <span className={`h-2.5 w-2.5 rounded-full ${dot}`} /> : <ListChecks size={14} />}
                  {label}
                  <span className="ml-auto rounded-full bg-slate-100 px-2 text-xs text-slate-500">{count}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="md:col-span-3">
            {/* เพิ่มงานใหม่ */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={addTodo}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">ความสำคัญ:</span>
                  {ORDER.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        priority === p ? PRIORITIES[p].active : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {PRIORITIES[p].label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  หมวดหมู่:
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {CAT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {CATS[k].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  กำหนดส่ง:
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
            </div>

            {/* ค้นหา */}
            <div className="relative mb-3">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 shadow focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* แท็บกรอง */}
            <div className="mb-3 flex gap-1 rounded-xl bg-slate-200/60 p-1">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                    filter === key ? "bg-white text-indigo-700 shadow" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* รายการ */}
            <ul>
              {visible.map((t) => {
                const p = PRIORITIES[t.priority];
                const c = CATS[t.category];
                const d = dueBadge(t);
                return (
                  <li
                    key={t.id}
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      t.removing ? "max-h-0 -translate-x-6 py-0 opacity-0" : "max-h-48 translate-x-0 py-1 opacity-100"
                    }`}
                  >
                    <div className="rounded-2xl bg-white p-3 pr-2 shadow-md">
                      <div className="flex items-center gap-3">
                        <span className={`h-9 w-1 shrink-0 rounded-full ${p.bar}`} />
                        <button
                          role="checkbox"
                          aria-checked={t.done}
                          aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
                          onClick={() => toggle(t.id)}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                            t.done ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white hover:border-indigo-400"
                          }`}
                        >
                          {t.done && <Check size={14} strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          {editingId === t.id ? (
                            <input
                              autoFocus
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.nativeEvent.isComposing) commitEdit();
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="w-full rounded-lg border border-indigo-300 px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          ) : (
                            <span
                              onDoubleClick={() => startEdit(t)}
                              title="ดับเบิลคลิกเพื่อแก้ไข"
                              className={`block cursor-text break-words py-1 transition ${
                                t.done ? "text-slate-400 line-through" : "text-slate-800"
                              }`}
                            >
                              {t.text}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => cyclePriority(t)}
                          title="คลิกเพื่อเปลี่ยนความสำคัญ"
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${p.badge}`}
                        >
                          {p.label}
                        </button>
                        <button
                          onClick={() => removeWithAnimation([t.id])}
                          aria-label="ลบงาน"
                          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
                        <button
                          onClick={() => cycleCategory(t)}
                          title="คลิกเพื่อเปลี่ยนหมวดหมู่"
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.chip}`}
                        >
                          {c.label}
                        </button>
                        <label
                          title="คลิกเพื่อเลือกวันที่"
                          className={`relative inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${d.cls}`}
                        >
                          <CalendarDays size={12} />
                          {d.label}
                          <input
                            type="date"
                            value={t.due || ""}
                            onChange={(e) => patch(t.id, { due: e.target.value })}
                            onClick={openPicker}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </label>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {visible.length === 0 && (
              <div className="rounded-2xl bg-white px-4 py-10 text-center text-slate-400 shadow-md">{emptyText}</div>
            )}

            {/* ส่วนท้าย */}
            <div className="mt-4 flex items-center justify-between px-1 text-sm">
              <span className="text-slate-600">เหลือ {remaining} งาน</span>
              <button
                onClick={clearCompleted}
                disabled={doneCount === 0}
                className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                ล้างงานที่เสร็จแล้ว ({doneCount})
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญหรือหมวดหมู่เพื่อเปลี่ยน
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
