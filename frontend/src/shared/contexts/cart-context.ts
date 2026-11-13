import { createContext } from "react";
import type { CartContextType } from "../types/cart";

export const CartContext = createContext<CartContextType | undefined>(undefined);
