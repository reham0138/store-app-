import { useEffect, useState } from "react";
import { getOrders } from "../utils/orderStorage";

export function useOrders() {
  const [orders, setOrders] = useState(getOrders);

  useEffect(() => {
    const refresh = () => setOrders(getOrders());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return orders;
}
