import { createContext, useContext, useState } from 'react';

const QuoteModalContext = createContext(null);

export function QuoteModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openModal  = () => setOpen(true);
  const closeModal = () => setOpen(false);
  return (
    <QuoteModalContext.Provider value={{ open, openModal, closeModal }}>
      {children}
    </QuoteModalContext.Provider>
  );
}

export function useQuoteModal() {
  const ctx = useContext(QuoteModalContext);
  if (!ctx) throw new Error('useQuoteModal must be inside QuoteModalProvider');
  return ctx;
}
