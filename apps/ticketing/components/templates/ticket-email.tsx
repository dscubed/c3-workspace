import * as React from "react";

export interface TicketEmailProps {
  firstName: string;
  eventName: string;
  orderId: string;
  /** CID reference or URL for the QR code image */
  ticketQrCodeUrl: string;
  eventDate?: string;
  venueName?: string;
  thumbnailUrl?: string | null;
}

/**
 * Ticket confirmation email — sent for events with ticketing enabled.
 * Instructs the attendee to show the QR code at the door.
 */
export function TicketEmailTemplate({
  firstName,
  eventName,
  orderId,
  ticketQrCodeUrl,
  eventDate,
  venueName,
  thumbnailUrl,
}: TicketEmailProps) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        color: "#333",
        backgroundColor: "#fff",
      }}
    >
      {/* Banner */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={eventName}
          style={{
            width: "100%",
            maxHeight: "220px",
            objectFit: "cover",
            borderRadius: "8px 8px 0 0",
            display: "block",
          }}
        />
      )}

      {/* Hero */}
      <div
        style={{
          backgroundColor: "#111",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#aaa", margin: "0 0 8px", fontSize: "14px" }}>
          You&apos;re in, {firstName}!
        </p>
        <h1 style={{ color: "#fff", margin: 0, fontSize: "22px" }}>
          {eventName}
        </h1>
        {(eventDate || venueName) && (
          <p style={{ color: "#ccc", margin: "12px 0 0", fontSize: "13px" }}>
            {[eventDate, venueName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* QR code */}
      <div style={{ textAlign: "center", padding: "32px 24px" }}>
        <p
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            margin: "0 0 8px",
          }}
        >
          Show this at the door
        </p>
        <p style={{ color: "#666", fontSize: "13px", margin: "0 0 20px" }}>
          Have this QR code ready when you arrive — it&apos;s your entry pass.
        </p>
        <img
          src={ticketQrCodeUrl}
          alt="Entry QR Code"
          style={{
            width: "180px",
            height: "180px",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #eee",
          padding: "16px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
          Order: {orderId}
        </p>
        <p style={{ fontSize: "12px", color: "#999", margin: "4px 0 0" }}>
          Powered by Connect3
        </p>
      </div>
    </div>
  );
}
