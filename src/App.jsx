import { useState } from "react";
import { Plus, Trash2, Check, ListChecks } from "lucide-react";

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-400",
    active: "bg-emerald-500 text-white border-emerald-500",
  },
  medium: {
    label: "กลาง",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-400",
    active: "bg-amber-500 text-white border-amber-500",
  },
  high: {
    label: "สูง",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-400",
    active: "bg-rose-500 text-white border-rose-500",
  },
};
const ORDER = ["low", "medium", "high"];

const FILTERS = [
  ["all", "ทั้งหมด"],
  ["active", "ยังไม่เสร็จ"],
  ["completed", "เสร็จแล้ว"],
];

const EMPTY = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย",
  active: "ไม่มีงานค้าง เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

const SEED = [
  { id: 1, text: "ส่งรายงานโปรเจกต์", done: false, priority: "high" },
  { id: 2, text: "ตอบอีเมลลูกค้า", done: false, priority: "medium" },
  { id: 3, text: "ซื้อของเข้าบ้าน", done: true, priority: "low" },
];

export default function TodoApp() {
  const [todos, setTodos] = useState(SEED);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [nextId, setNextId] = useState(4);

  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.filter((t) => t.done).length;
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos([{ id: nextId, text: value, done: false, priority }, ...todos]);
    setNextId(nextId + 1);
    setText("");
  };

  const onInputKey = (e) => {
    // ไม่ส่งฟอร์มขณะกำลังเลือกคำจากแป้นพิมพ์ภาษาไทย/IME
    if (e.key === "Enter" && !e.nativeEvent.isComposing) addTodo();
  };

  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const cyclePriority = (id) =>
    setTodos(
      todos.map((t) =>
        t.id === id
          ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] }
          : t
      )
    );

  // เล่นแอนิเมชันก่อนลบจริง
  const removeWithAnimation = (ids) => {
    setTodos((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, removing: true } : t))
    );
    setTimeout(
      () => setTodos((prev) => prev.filter((t) => !ids.includes(t.id))),
      300
    );
  };

  const clearCompleted = () =>
    removeWithAnimation(todos.filter((t) => t.done).map((t) => t.id));

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditText(t.text);
  };

  const commitEdit = () => {
    const value = editText.trim();
    if (value) {
      setTodos(todos.map((t) => (t.id === editingId ? { ...t, text: value } : t)));
    }
    setEditingId(null);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
            <ListChecks size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จัดการงานประจำวันให้เป็นระเบียบ</p>
          </div>
        </header>

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

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ:</span>
            {ORDER.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  priority === p
                    ? PRIORITIES[p].active
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {PRIORITIES[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* แท็บกรอง */}
        <div className="mb-3 flex gap-1 rounded-xl bg-slate-200/60 p-1">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                filter === key
                  ? "bg-white text-indigo-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
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
            return (
              <li
                key={t.id}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  t.removing
                    ? "max-h-0 -translate-x-6 py-0 opacity-0"
                    : "max-h-40 translate-x-0 py-1 opacity-100"
                }`}
              >
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-2 shadow-md">
                  <span className={`h-9 w-1 shrink-0 rounded-full ${p.bar}`} />

                  <button
                    role="checkbox"
                    aria-checked={t.done}
                    aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
                    onClick={() => toggle(t.id)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      t.done
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white hover:border-indigo-400"
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
                    onClick={() => cyclePriority(t.id)}
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
              </li>
            );
          })}
        </ul>

        {visible.length === 0 && (
          <div className="rounded-2xl bg-white px-4 py-10 text-center text-slate-400 shadow-md">
            {EMPTY[filter]}
          </div>
        )}

        {/* ส่วนท้าย */}
        <div className="mt-4 flex items-center justify-between px-1 text-sm">
          <span className="text-slate-600">เหลือ {remaining} งาน</span>
          <button
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            ล้างงานที่เสร็จแล้ว ({completedCount})
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
