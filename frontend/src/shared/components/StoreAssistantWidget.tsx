import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, X, Bot, Trash2, Sparkles, RotateCcw } from "lucide-react";
import { apiClient } from "../api/client";
import { useCart } from "../hooks/useCart";
import { useBranch } from "../contexts/useBranch";

type ChatMessage = { role: "user" | "assistant"; content: string; selectedProductName?: string };
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
  const [replyLanguageArabic, setReplyLanguageArabic] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, suggestedQuestions]);

  function clearConversation() {
    if (loading) return;
    setMessages([]);
    setMessage("");
    setSuggestedQuestions([]);
    setShowBrowseProducts(false);
    setConfirmClear(false);
    setReplyLanguageArabic(true);
  }

  async function send(text = message) {
    const content = text.trim();
    if (!content || loading) return;
    const selectedCartItem = selectedProductId
      ? items.find(({ product }) => product.id === selectedProductId)
      : undefined;
    const selectedProductName = selectedCartItem?.product.title?.trim();
    const contextualContent = selectedProductName
      ? `المنتج المحدد من السلة: "${selectedProductName}". سؤال المستخدم: ${content}`
      : content;
    const history = messages.slice(-10).map((entry) => ({
      role: entry.role,
      content: entry.role === "user" && entry.selectedProductName
        ? `Selected cart product: "${entry.selectedProductName}". User question: ${entry.content}`
        : entry.content,
    }));
    const requestIsArabic = /[\u0600-\u06FF]/.test(content);
    setReplyLanguageArabic(requestIsArabic);
    setMessages((previous) => [...previous, { role: "user", content, selectedProductName }]);
    setMessage("");
    setSuggestedQuestions([]);
    setShowBrowseProducts(false);
    setConfirmClear(false);
    setLoading(true);
    try {
      const response = await apiClient.post<AssistantReply>(
        "/assistant/chat",
        {
          message: contextualContent,
          productId: selectedProductId || undefined,
          selectedProductName: selectedProductName || undefined,
          branchId: selectedBranch?.id,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          history,
        },
        { timeout: 75000 },
      );
      const sourceText = response.data.sources?.length
        ? "\n\nالمصادر:\n" + response.data.sources.map((source) => `• ${source.title}: ${source.url}`).join("\n")
        : "";
      setMessages((previous) => [...previous, { role: "assistant", content: response.data.message + sourceText }]);
      const replyIsArabic = /[\u0600-\u06FF]/.test(response.data.message);
      setReplyLanguageArabic(replyIsArabic);
      setSuggestedQuestions(response.data.suggestedQuestions ?? (replyIsArabic
        ? ["كيف بفلتر المنتجات حسب الفئة؟", "كيف بعرف إذا المنتج متوفر بفرعي؟", "كيف بقارن بين منتجين؟"]
        : ["How do I filter products by category?", "How can I check stock at my branch?", "Can you compare two products?"]));
      setShowBrowseProducts(Boolean(response.data.browseProducts));
    } catch {
      setMessages((previous) => [...previous, { role: "assistant", content: CONNECTION_ERROR_MESSAGE }]);
      setSuggestedQuestions(requestIsArabic
        ? ["شو المنتجات المتوفرة؟", "شو الفئات الموجودة بالمتجر؟"]
        : ["What products are available?", "What store categories do you have?"]);
      setShowBrowseProducts(false);
      setReplyLanguageArabic(requestIsArabic);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] font-sans sm:bottom-5 sm:right-5" dir="rtl">
      {open && (
        <section className="mb-3 flex h-[min(680px,calc(100dvh-6rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface-white shadow-[0_18px_60px_rgba(15,23,42,0.22)] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <header className="flex shrink-0 items-center justify-between bg-brand-navy px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Bot size={22} /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">مساعد Crown & Anchor</p>
                <p className="mt-0.5 text-[11px] text-white/70">موجود لمساعدتك باختيار المنتجات</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setConfirmClear(true)} disabled={!messages.length || loading}
                aria-label="حذف المحادثة" title="حذف المحادثة"
                className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                <Trash2 size={18} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق المساعد"
                className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"><X size={19} /></button>
            </div>
          </header>

          {confirmClear && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-cream px-4 py-3">
              <p className="text-xs text-text-main">متأكدة إنك بدك تحذفي المحادثة؟</p>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg px-2.5 py-1.5 text-xs text-text-slate hover:bg-black/5">إلغاء</button>
                <button type="button" onClick={clearConversation} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700">حذف</button>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-surface-white px-3 py-4 sm:px-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col justify-center gap-4 py-3">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-cream text-brand-navy"><Sparkles size={27} /></div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-text-main">أهلاً فيك! كيف بقدر أساعدك؟</h3>
                  <p className="mx-auto mt-1.5 max-w-[270px] text-xs leading-6 text-text-slate">اسأليني عن المنتجات، الأسعار، التقييمات أو توفر المنتجات بالفروع.</p>
                </div>
                <div className="space-y-2">
                  <p className="px-1 text-[11px] font-medium text-text-slate">ابدئي بسؤال سريع</p>
                  <div className="grid gap-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => void send(suggestion)}
                        className="rounded-xl border border-border-subtle bg-surface-white px-3 py-2.5 text-right text-xs leading-5 text-text-main transition hover:border-brand-gold hover:bg-surface-cream active:scale-[0.99]">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((item, index) => (
              <div key={index} dir={/[\u0600-\u06FF]/.test(item.content) ? "rtl" : "ltr"}
                className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-start text-[13px] leading-6 shadow-sm ${item.role === "user" ? "mr-auto rounded-br-md bg-brand-navy text-white" : "ml-auto rounded-bl-md bg-surface-cream text-text-main"}`}>
                {item.content}
              </div>
            ))}

            {!loading && messages.length > 0 && suggestedQuestions.length > 0 && (
              <div className="ml-auto flex max-w-[95%] flex-col items-start gap-2">
                <p className="text-[11px] font-medium text-text-slate">{replyLanguageArabic ? "ممكن كمان تسألي" : "You might also ask"}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button key={question} type="button" onClick={() => void send(question)}
                      className="rounded-full border border-border-subtle bg-surface-white px-3 py-2 text-xs text-brand-navy transition hover:border-brand-gold hover:bg-surface-cream">
                      {question}
                    </button>
                  ))}
                </div>
                {showBrowseProducts && (
                  <button type="button" onClick={() => { setOpen(false); navigate("/products"); }}
                    className="rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-medium text-white transition hover:opacity-90">
                    {replyLanguageArabic ? "افتحي قائمة المنتجات والفلاتر" : "Browse products and filters"}
                  </button>
                )}
              </div>
            )}

            {loading && (
              <div className="ml-auto flex max-w-[88%] items-center gap-2 rounded-2xl rounded-bl-md bg-surface-cream px-3.5 py-3 text-xs text-text-slate">
                <span className="size-1.5 animate-pulse rounded-full bg-brand-gold" />
                {replyLanguageArabic ? "عم حضّر الإجابة..." : "Preparing your answer..."}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 space-y-2.5 border-t border-border-subtle bg-surface-white p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="assistant-product" className="text-[11px] font-medium text-text-slate">المنتج من سلتك (اختياري)</label>
              {selectedProductId && <button type="button" onClick={() => setSelectedProductId("")} className="text-[11px] text-brand-navy underline underline-offset-2">إلغاء التحديد</button>}
            </div>
            <select id="assistant-product" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}
              className="h-10 w-full rounded-xl border border-border-subtle bg-surface-white px-3 text-xs text-text-main outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20">
              <option value="">ما في منتج محدد</option>
              {items.map(({ product }) => <option key={product.id} value={product.id}>{product.title}</option>)}
            </select>
            <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-end gap-2">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
                placeholder="اكتبي سؤالك هون..." rows={1} maxLength={2000}
                className="max-h-28 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-border-subtle bg-surface-white px-3 py-3 text-sm text-text-main outline-none transition placeholder:text-text-slate/70 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" />
              <button type="submit" disabled={!message.trim() || loading} aria-label="إرسال"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
                <Send size={17} />
              </button>
            </form>
            <p className="text-center text-[10px] text-text-slate/70">Enter للإرسال · Shift + Enter لسطر جديد</p>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "إغلاق مساعد المتجر" : "فتح مساعد المتجر"}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-brand-navy text-white shadow-lg transition duration-200 hover:scale-105 hover:shadow-xl active:scale-95">
        {open ? <X size={23} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
