import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { apiClient } from "../api/client";
import { useCart } from "../hooks/useCart";
import { useBranch } from "../contexts/useBranch";

type ChatMessage = { role: "user" | "assistant"; content: string };
type AssistantReply = { message: string; sources?: { title: string; url: string }[]; browseProducts?: boolean; suggestedQuestions?: string[] };

const CONNECTION_ERROR_MESSAGE =
  "عذراً، تعذّر الاتصال بالمساعد حالياً. يرجى المحاولة مرة أخرى بعد قليل.";

export default function StoreAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showBrowseProducts, setShowBrowseProducts] = useState(false);
  const navigate = useNavigate();
  const { items } = useCart();
  const { selectedBranch } = useBranch();

  const suggestions = [
    "شو المنتجات المتوفرة؟",
    "شو الفئات الموجودة بالمتجر؟",
    "وين فروع المتجر؟",
    "اقترح علي منتجات الأعلى تقييماً",
    "شو سعر ومخزون المنتج المحدد؟",
  ];

  async function send(text = message) {
    const content = text.trim();
    if (!content || loading) return;
    const history = messages.slice(-10);
    setMessages((previous) => [...previous, { role: "user", content }]);
    setMessage("");
    setSuggestedQuestions([]);
    setShowBrowseProducts(false);
    setLoading(true);
    try {
      const response = await apiClient.post<AssistantReply>(
        "/assistant/chat",
        {
          message: content,
          productId: selectedProductId || undefined,
          branchId: selectedBranch?.id,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          history,
        },
        // Ollama may need substantially longer than the API client's default 15 seconds.
        // The backend's model timeout is 60 seconds, so leave a small response margin.
        { timeout: 75000 },
      );
      const sourceText = response.data.sources?.length
        ? "\n\nالمصادر:\n" + response.data.sources.map((source) => `• ${source.title}: ${source.url}`).join("\n")
        : "";
      setMessages((previous) => [...previous, { role: "assistant", content: response.data.message + sourceText }]);
      setSuggestedQuestions(response.data.suggestedQuestions ?? [
        "كيف بفلتر المنتجات حسب الفئة؟",
        "كيف بعرف إذا المنتج متوفر بفرعي؟",
        "كيف بقارن بين منتجين؟",
      ]);
      setShowBrowseProducts(Boolean(response.data.browseProducts));
    } catch {
      // Show shoppers a friendly message; technical details stay in backend logs.
      setMessages((previous) => [...previous, { role: "assistant", content: CONNECTION_ERROR_MESSAGE }]);
      setSuggestedQuestions(["شو المنتجات المتوفرة؟", "شو الفئات الموجودة بالمتجر؟"]);
      setShowBrowseProducts(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] font-sans" dir="rtl">
      {open && (
        <section className="mb-3 flex h-[min(620px,75vh)] w-[min(370px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-white shadow-2xl">
          <header className="flex items-center justify-between bg-brand-navy px-4 py-3 text-white">
            <div className="flex items-center gap-2"><Bot size={21} /><div><p className="font-semibold">مساعد Crown & Anchor</p><p className="text-xs text-white/70">مساعدة في منتجات المتجر</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق المساعد" className="rounded-lg p-1 hover:bg-white/10"><X size={20} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="rounded-xl bg-surface-cream p-3 text-sm text-text-main">أهلاً! فيني ساعدك بمعلومات المنتجات ومواصفاتها. اختاري منتجاً من سلتك إذا كان سؤالك عن منتج محدد.</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-full border border-border-subtle px-3 py-2 text-xs text-brand-navy hover:bg-surface-cream">{suggestion}</button>)}
                </div>
              </div>
            )}
            {messages.map((item, index) => (
              <div key={index} dir={/[\u0600-\u06FF]/.test(item.content) ? "rtl" : "ltr"} className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm text-start ${item.role === "user" ? "mr-auto bg-brand-navy text-white" : "ml-auto bg-surface-cream text-text-main"}`}>{item.content}</div>
            ))}
            {!loading && messages.length > 0 && suggestedQuestions.length > 0 && (
              <div className="ml-auto flex max-w-[95%] flex-col items-start gap-2">
                <p className="text-xs text-text-slate">أسئلة ممكن تهمك</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button key={question} type="button" onClick={() => void send(question)}
                      className="rounded-full border border-border-subtle bg-surface-white px-3 py-2 text-xs text-brand-navy hover:bg-surface-cream">
                      {question}
                    </button>
                  ))}
                </div>
                {showBrowseProducts && (
                  <button type="button" onClick={() => { setOpen(false); navigate("/products"); }}
                    className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white">
                    افتحي قائمة المنتجات والفلاتر
                  </button>
                )}
              </div>
            )}
            {loading && <p className="text-xs text-text-slate">عم حضّر الإجابة...</p>}
          </div>
          <div className="space-y-2 border-t border-border-subtle p-3">
            <label className="block text-xs font-medium text-text-slate">المنتج الموجود في السلة</label>
            <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="h-10 w-full rounded-lg border border-border-subtle bg-surface-white px-2 text-sm">
              <option value="">بدون منتج محدد</option>
              {items.map(({ product }) => <option key={product.id} value={product.id}>{product.title}</option>)}
            </select>
            <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex gap-2">
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتبي سؤالك عن منتجات المتجر..." className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-white px-3 py-2 text-sm outline-none focus:border-brand-gold" maxLength={2000} />
              <button type="submit" disabled={!message.trim() || loading} aria-label="إرسال" className="rounded-xl bg-brand-navy px-3 text-white disabled:opacity-50"><Send size={17} /></button>
            </form>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="فتح مساعد المتجر" className="ml-auto flex size-14 items-center justify-center rounded-full bg-brand-navy text-white shadow-lg transition hover:scale-105">
        {open ? <X size={23} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
