export type TicketStatus = "pending" | "confirmed" | "cancelled" | "refunded" | "used";

export type Ticket = {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  status: TicketStatus;
  qr_code: string | null;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketType = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  sold_count: number;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
};
