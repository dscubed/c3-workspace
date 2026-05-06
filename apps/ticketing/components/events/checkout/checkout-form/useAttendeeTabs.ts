import { useCheckoutContext } from "./CheckoutContext";

export function useAttendeeTabs() {
  const { quantity, activeTicketTab, checkoutMode } = useCheckoutContext();
  const label = checkoutMode === "registration" ? "Attendee" : "Ticket";
  const tabs = Array.from({ length: quantity }, (_, i) => ({
    value: `ticket-${i}`,
    label: `${label} ${i + 1}`,
  }));
  const activeIndex = tabs.findIndex((t) => t.value === activeTicketTab);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  return { tabs, safeIndex };
}
