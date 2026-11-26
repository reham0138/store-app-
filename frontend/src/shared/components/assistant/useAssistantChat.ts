import { useRef, useState } from "react";
import axios from "axios";
import { apiClient } from "../../api/client";
import { useBranch } from "../../contexts/useBranch";
import { STRINGS } from "./strings";
import type { AssistantReply, AssistantRequest, ChatMessage, Language, ProductRef } from "./types";

// The backend only accepts MongoDB ids; mock-catalog ids ("1", "damascus") are left out.
const mongoId = (value?: string) => (value && /^[0-9a-f]{24}$/i.test(value) ? value : undefined);
const languageOf = (text: string): Language => (/[ء-ي]/.test(text) ? "ar" : "en");

export function useAssistantChat(onReply: (reply: AssistantReply) => void) {
  const { selectedBranch } = useBranch();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("ar");
  const nextId = useRef(0);

  async function deliver(request: AssistantRequest) {
    setLoading(true);
    const replyLanguage = languageOf(request.message);
    try {
      const { data } = await apiClient.post<AssistantReply>("/assistant/chat", request, { timeout: 45000 });
      setMessages((previous) => [...previous, {
        id: nextId.current++, role: "assistant", time: new Date(),
        language: data.language, content: data.message, reply: data,
      }]);
      setLanguage(data.language);
      onReply(data);
    } catch (error) {
      const limited = axios.isAxiosError(error) && error.response?.status === 429;
      setMessages((previous) => [...previous, {
        id: nextId.current++, role: "assistant", time: new Date(), language: replyLanguage,
        content: STRINGS[replyLanguage][limited ? "rateError" : "connectionError"],
        failedRequest: request,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function send(text: string, product: ProductRef | null) {
    const content = text.trim();
    if (!content || loading) return false;
    const request: AssistantRequest = {
      message: content,
      productId: mongoId(product?.id),
      selectedProductName: product?.name.trim().slice(0, 200) || undefined,
      branchId: mongoId(selectedBranch?.id),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      history: messages
        .filter((entry) => !(entry.role === "assistant" && entry.failedRequest))
        .slice(-10)
        .map((entry) => ({ role: entry.role, content: entry.content.slice(0, 2000) })),
    };
    setLanguage(languageOf(content));
    setMessages((previous) => [...previous.filter((entry) => !(entry.role === "assistant" && entry.failedRequest)), {
      id: nextId.current++, role: "user", time: new Date(),
      language: languageOf(content), content, productName: product?.name,
    }]);
    void deliver(request);
    return true;
  }

  function retry(request: AssistantRequest) {
    if (loading) return;
    setMessages((previous) => previous.filter((entry) => !(entry.role === "assistant" && entry.failedRequest)));
    void deliver(request);
  }

  return { messages, loading, language, setLanguage, send, retry, clear: () => setMessages([]) };
}
