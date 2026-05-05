import * as React from "react";

export interface RegistrationEmailProps {
  firstName: string;
  eventName: string;
  registrationId: string;
  /** CID reference or URL for the QR code image */
  qrCodeUrl: string;
  eventDate?: string;
  venueName?: string;
  thumbnailUrl?: string | null;
}

/**
 * Registration confirmation email — sent for non-ticketed events.
 * Instructs the attendee to scan their QR at the event to log attendance and earn rewards.
 */
export function RegistrationEmailTemplate({
  firstName,
  eventName,
  registrationId,
  qrCodeUrl,
  eventDate,
  venueName,
  thumbnailUrl,
}: RegistrationEmailProps) {
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
          backgroundColor: "#1a1a2e",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#aaa", margin: "0 0 8px", fontSize: "14px" }}>
          You&apos;re registered, {firstName}!
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
          Your attendance QR code
        </p>
        <p style={{ color: "#666", fontSize: "13px", margin: "0 0 20px" }}>
          Get this scanned at the event to log your attendance and earn rewards.
          You don&apos;t need it to enter — just bring it along!
        </p>
        <img
          src={qrCodeUrl}
          alt="Attendance QR Code"
          style={{
            width: "180px",
            height: "180px",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Rewards callout */}
      <div
        style={{
          margin: "0 24px 24px",
          backgroundColor: "#f5f5ff",
          borderRadius: "8px",
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontWeight: "bold", margin: "0 0 4px", fontSize: "14px" }}>
          Earn rewards 🎉
        </p>
        <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>
          Every scan counts towards your club engagement score. Keep attending
          events to unlock exclusive perks.
        </p>
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
          Registration: {registrationId}
        </p>
        <p style={{ fontSize: "12px", color: "#999", margin: "4px 0 0" }}>
          Powered by Connect3
        </p>
      </div>
    </div>
  );
}
