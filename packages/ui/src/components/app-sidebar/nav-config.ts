import {
  Calendar,
  UsersRound,
  Wallet,
  CreditCard,
  Ticket,
  LayoutDashboard,
  Home,
  Instagram,
  Image as ImageIcon,
  CalendarCog,
  Settings2,
  ScanLine,
  ShieldUser,
} from "lucide-react";
import type { ElementType } from "react";

export type NavChild = { label: string; icon: ElementType; path: string };
export type NavSite = {
  label?: string;
  baseUrl: string;
  current: boolean;
  children: NavChild[];
  separator?: boolean;
};

export type AppId = "connect3" | "ticketing" | "admin";

const SITE_URL = process.env.NEXT_PUBLIC_CONNECT3_URL ?? "http://localhost:3000";
const TICKETING_URL = process.env.NEXT_PUBLIC_TICKETING_URL ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3001";
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3002";

export function buildSites(currentApp: AppId, isOrg: boolean, hasClubs: boolean): NavSite[] {
  const homeSite: NavSite = {
    baseUrl: SITE_URL,
    current: currentApp === "connect3",
    children: [
      { label: "Home", icon: Home, path: "/" },
      { label: "Events", icon: Calendar, path: "/events" },
      { label: "Clubs", icon: UsersRound, path: "/clubs" },
      { label: "Pass", icon: Wallet, path: "/pass" },
    ],
  };

  const ticketingOrgSite: NavSite = {
    label: "TICKETING",
    baseUrl: TICKETING_URL,
    current: currentApp === "ticketing",
    children: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Instagram", icon: Instagram, path: "/dashboard/instagram" },
      { label: "Media", icon: ImageIcon, path: "/dashboard/media" },
      { label: "Events", icon: Calendar, path: "/dashboard/events" },
    ],
  };

  const ticketingUserSite: NavSite = {
    label: "TICKETING",
    baseUrl: TICKETING_URL,
    current: currentApp === "ticketing",
    children: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Tickets", icon: Ticket, path: "/dashboard/tickets" },
    ],
  };

  const ticketingClubSite: NavSite = {
    label: "",
    baseUrl: TICKETING_URL,
    current: currentApp === "ticketing",
    separator: true,
    children: [
      { label: "Instagram", icon: Instagram, path: "/dashboard/instagram" },
      { label: "Media", icon: ImageIcon, path: "/dashboard/media" },
      { label: "Edit Events", icon: CalendarCog, path: "/dashboard/events" },
    ],
  };

  const adminSite: NavSite = {
    label: "ADMIN",
    baseUrl: ADMIN_URL,
    current: currentApp === "admin",
    children: [
      { label: "Manage", icon: Settings2, path: "/dashboard" },
      { label: "Events", icon: ScanLine, path: "/dashboard/events" },
      { label: "Members", icon: UsersRound, path: "/dashboard/members" },
      { label: "Committee", icon: ShieldUser, path: "/dashboard/committee" },
      { label: "Payment", icon: CreditCard, path: "/dashboard/payment" },
    ],
  };

  if (isOrg) return [homeSite, ticketingOrgSite, adminSite];
  if (hasClubs) return [homeSite, ticketingUserSite, ticketingClubSite, adminSite];
  return [homeSite, ticketingUserSite, ticketingClubSite];
}

export function isChildActive(pathname: string, path: string) {
  return path === "/" || path === "/dashboard"
    ? pathname === path
    : pathname.startsWith(path);
}
