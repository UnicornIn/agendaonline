import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastFn = (text: string) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback<ToastFn>((t) => {
    setText(t);
    setOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), 2600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">{text}</div>
    </ToastContext.Provider>
  );
}

export const useToast = (): ToastFn => useContext(ToastContext);
