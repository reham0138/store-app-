import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpLeft, Bot, Languages, MapPin, PackageSearch, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { useBranch } from "../contexts/useBranch";
import { useProductQuery } from "../hooks/useApiQueries";
import FormattedReply from "./assistant/FormattedReply";
import ProductPicker from "./assistant/ProductPicker";
import ProductThumb from "./assistant/ProductThumb";
import ReplyProductCard from "./assistant/ReplyProductCard";
import { STRINGS } from "./assistant/strings";
import type { ProductRef } from "./assistant/types";
import { useAssistantChat } from "./assistant/useAssistantChat";

const HEADER_BUTTON =
  "rounded-xl p-2 text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const CHIP =
  "rounded-full border border-border-subtle bg-surface-white px-3 py-1.5 text-xs text-brand-navy transition hover:border-brand-gold hover:bg-brand-gold/10 active:scale-[0.98]";

type Pin = { product: ProductRef; onPage?: string };

export default function StoreAssistantWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { selectedBranch } = useBranch();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [picking, setPicking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pin, setPin] = useState<Pin | null>(null);
  const [dismissedPage, setDismissedPage] = useState<string>();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // On a product page that product is selected automatically.
  const pageId = /^\/products\/([^/]+)\/?$/.exec(pathname)?.[1];
  const pageQuery = useProductQuery(open ? pageId : undefined, selectedBranch?.id);
  const pageProduct = pageId && pageId !== dismissedPage && pageQuery.data
    ? { id: pageQuery.data.id, name: pageQuery.data.title, thumbnail: pageQuery.data.thumbnail }
    : null;
  const product = pin && (!pageId || pin.onPage === pageId) ? pin.product : pageProduct;

  const selectProduct = (next: ProductRef) => setPin({ product: next, onPage: pageId });
  const { messages, loading, language, setLanguage, send, retry, clear } = useAssistantChat((reply) => {
    if (reply.focusProduct) selectProduct(reply.focusProduct);
  });
  const t = STRINGS[language];
  const last = messages[messages.length - 1];
  const lastReply = last?.role === "assistant" ? last.reply : undefined;

  useEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;
    // Long answers start at their first line; everything else sticks to the bottom.
    const answer = !loading && lastReply
      ? list.querySelector<HTMLElement>("[data-latest='true']") : null;
    const top = answer ? answer.offsetTop - 12 : list.scrollHeight;
    list.scrollTo({ top, behavior: "smooth" });
  }, [open, messages, loading, lastReply]);

  useEffect(() => {
    // Skip on touch screens so the keyboard does not cover the conversation.
    if (open && window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [open]);

  // This is a shopping assistant; staff dashboards stay uncluttered.
  if (pathname.startsWith("/dashboard")) return null;

  function submit(text: string, about: ProductRef | null = product) {
    if (!send(text, about)) return false;
    setConfirmClear(false);
    setPicking(false);
    return true;
  }

  function submitDraft() {
    if (!submit(draft)) return;
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "";
  }

  function goTo(path: string) {
    // The panel covers the whole screen on phones, so close it to show the page.
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
    navigate(path);
  }

  const time = new Intl.DateTimeFormat(language === "ar" ? "ar-SY-u-nu-latn" : "en-US", {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="assistant-root font-sans" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      {open && (
        <section
          role="dialog" aria-label={t.title}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            if (picking) setPicking(false);
            else setOpen(false);
          }}
          className="assistant-panel fixed inset-0 z-[110] flex flex-col overflow-hidden bg-surface-white sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(700px,calc(100dvh-7.5rem))] sm:w-[410px] sm:rounded-3xl sm:border sm:border-border-subtle sm:shadow-xl"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-brand-gold bg-gradient-to-br from-[#0B2D4A] to-[#164a73] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gold text-[#0B2D4A]">
                <Bot size={22} />
                <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-[#0B2D4A] bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/70">
                  {selectedBranch ? (<><MapPin aria-hidden="true" size={11} /><bdi>{t.branch(selectedBranch.name)}</bdi></>) : t.online}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                aria-label={t.switchLanguage} title={t.switchLanguage} className={HEADER_BUTTON}><Languages size={18} /></button>
              <button type="button" onClick={() => setConfirmClear(true)} disabled={!messages.length || loading}
                aria-label={t.clear} title={t.clear} className={HEADER_BUTTON}><Trash2 size={18} /></button>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className={HEADER_BUTTON}><X size={19} /></button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col">
            {picking && (
              <ProductPicker language={language} onClose={() => setPicking(false)}
                onPick={(next) => { selectProduct(next); setPicking(false); }} />
            )}

            {confirmClear && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-cream px-4 py-2.5">
                <p className="text-xs text-text-main">{t.confirmClear}</p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setConfirmClear(false)}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-text-slate hover:bg-black/5">{t.cancel}</button>
                  <button type="button" onClick={() => { clear(); setPin(null); setConfirmClear(false); }}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">{t.remove}</button>
                </div>
              </div>
            )}

            <div ref={listRef} role="log" aria-live="polite"
              className="relative flex-1 space-y-4 overflow-y-auto overscroll-contain bg-surface-cream px-3 py-4 sm:px-4">
              {messages.length === 0 && (
                <div className="flex min-h-full flex-col items-center justify-center gap-4 py-2 text-center">
                  <div className="flex size-16 items-center justify-center rounded-3xl bg-surface-white text-brand-gold shadow-sm">
                    <Sparkles size={30} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-navy">{t.welcomeTitle}</h3>
                    <p className="mx-auto mt-1 max-w-[290px] text-xs leading-6 text-text-slate">
                      {product ? t.welcomeProduct : t.welcomeText}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2">
                    {(product ? t.productStarters : t.starters).map((question) => (
                      <button key={question} type="button" onClick={() => submit(question)}
                        className="flex min-h-16 items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-surface-white p-3 text-start text-xs leading-5 text-text-main transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-sm">
                        {question}
                        <ArrowUpLeft aria-hidden="true" size={14} className={`shrink-0 text-brand-gold ${language === "en" ? "rotate-90" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((item) => item.role === "user" ? (
                <div key={item.id} className="assistant-message flex flex-col items-start">
                  <div dir="auto"
                    className={`${language === "ar" ? "rounded-tr-md" : "rounded-tl-md"} max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-[#0B2D4A] px-3.5 py-2.5 text-start text-[13px] leading-6 text-white shadow-xs`}>
                    {item.content}
                  </div>
                  <p className="mt-1 flex max-w-[85%] items-center gap-1.5 px-1 text-[10px] text-text-slate">
                    {item.productName && <><bdi className="truncate">{item.productName}</bdi><span aria-hidden="true">·</span></>}
                    <span className="shrink-0">{time.format(item.time)}</span>
                  </p>
                </div>
              ) : (
                <div key={item.id} data-latest={item === last} className="assistant-message flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                    <div dir={item.language === "ar" ? "rtl" : "ltr"}
                      className={`max-w-full break-words rounded-2xl border bg-surface-white px-3.5 py-2.5 text-start text-[13px] leading-6 text-text-main shadow-2xs ${language === "ar" ? "rounded-tl-md" : "rounded-tr-md"} ${item.failedRequest ? "border-status-error/40" : "border-border-subtle"}`}>
                      <FormattedReply text={item.content} />
                      {item.reply?.aiGenerated && (
                        <p className="mt-2 border-t border-border-subtle pt-1.5 text-[10px] text-text-slate">{STRINGS[item.language].aiNote}</p>
                      )}
                      {item.failedRequest && (
                        <button type="button" disabled={loading} onClick={() => retry(item.failedRequest!)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0B2D4A] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                          <RotateCcw aria-hidden="true" size={13} />{STRINGS[item.language].retry}
                        </button>
                      )}
                    </div>
                    {item.reply?.products.map((card) => (
                      <div key={card.id} className="w-full" dir={item.language === "ar" ? "rtl" : "ltr"}>
                        <ReplyProductCard product={card} language={item.language}
                          active={card.id === product?.id}
                          onView={() => goTo(`/products/${card.id}`)}
                          onAsk={() => { selectProduct(card); inputRef.current?.focus(); }} />
                      </div>
                    ))}
                  </div>
                  <div aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#0B2D4A] text-brand-gold">
                    <Bot size={15} />
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-end" aria-label={t.thinking}>
                  <div className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface-white px-3.5 py-3 text-xs text-text-slate">
                    {t.thinking}
                    <span className="flex gap-1" dir="ltr">
                      {[0, 150, 300].map((delay) => (
                        <span key={delay} style={{ animationDelay: `${delay}ms` }} className="size-1.5 animate-bounce rounded-full bg-brand-gold" />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              {!loading && lastReply && (
                <div className="flex flex-wrap justify-end gap-2 pe-9">
                  {lastReply.suggestedQuestions.map((question) => (
                    <button key={question} type="button" dir="auto" onClick={() => submit(question)} className={CHIP}>{question}</button>
                  ))}
                  {lastReply.needsProduct && (
                    <button type="button" onClick={() => setPicking(true)}
                      className="rounded-full bg-brand-gold px-3 py-1.5 text-xs font-semibold text-[#0B2D4A] hover:opacity-90">{t.chooseProduct}</button>
                  )}
                  {lastReply.browseProducts && (
                    <button type="button" onClick={() => goTo("/products")}
                      className="rounded-full bg-[#0B2D4A] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">{t.browse}</button>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-2 border-t border-border-subtle bg-surface-white p-3">
              {product ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-brand-gold/50 bg-brand-gold/10 p-1.5">
                  <ProductThumb src={product.thumbnail} className="size-9 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] leading-4 text-text-slate">{t.askingAbout}</p>
                    <p className="truncate text-start text-xs font-semibold text-brand-navy"><bdi>{product.name}</bdi></p>
                  </div>
                  <button type="button" onClick={() => setPicking(true)}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-navy underline underline-offset-2">{t.changeProduct}</button>
                  <button type="button" onClick={() => { setPin(null); setDismissedPage(pageId); }} aria-label={t.clearProduct} title={t.clearProduct}
                    className="rounded-lg p-1.5 text-text-slate hover:bg-black/5"><X size={14} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setPicking(true)}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-brand-gold px-3 py-1.5 text-xs font-medium text-brand-navy hover:bg-brand-gold/10">
                  <PackageSearch aria-hidden="true" size={14} />{t.chooseProduct}
                </button>
              )}
              <form onSubmit={(event) => { event.preventDefault(); submitDraft(); }} className="flex items-end gap-2">
                <textarea ref={inputRef} value={draft} rows={1} maxLength={2000} dir="auto"
                  aria-label={t.placeholder} placeholder={t.placeholder}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    event.target.style.height = "auto";
                    event.target.style.height = `${Math.min(event.target.scrollHeight + 2, 112)}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                    event.preventDefault();
                    submitDraft();
                  }}
                  className="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-border-subtle bg-surface-cream px-3.5 py-2.5 text-base leading-5 text-text-main outline-none transition placeholder:text-text-slate/70 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 sm:text-sm" />
                <button type="submit" disabled={!draft.trim() || loading} aria-label={t.send} title={t.send}
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B2D4A] text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35">
                  <Send size={17} className={language === "ar" ? "-scale-x-100" : undefined} />
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)}
        aria-label={open ? t.close : t.open} aria-expanded={open}
        className={`fixed bottom-4 right-4 z-[100] flex h-14 items-center justify-center gap-2 rounded-full border-2 border-brand-gold bg-[#0B2D4A] text-white shadow-lg transition hover:scale-105 active:scale-95 sm:bottom-5 sm:right-5 ${open ? "w-14" : "w-14 sm:w-auto sm:px-5"}`}>
        {open ? <X size={23} /> : (
          <>
            <Bot size={24} className="text-brand-gold" />
            <span className="hidden text-sm font-semibold sm:inline">{t.launcher}</span>
          </>
        )}
      </button>
    </div>
  );
}
