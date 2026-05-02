// Mock clubs
export const mockClubs = [
  { id: "club-1", name: "DS Cubed", avatarUrl: null, role: "President" },
  { id: "club-2", name: "CSSC", avatarUrl: null, role: "Committee Member" },
  { id: "club-3", name: "MathSoc", avatarUrl: null, role: "Committee Member" },
];

// Mock current user
export const mockCurrentUser = {
  name: "Tanat Chanwangsa",
  email: "tchanwangsa@gmail.com",
  avatarUrl: null,
  role: "President",
};

// Mock stats
export const mockStats = {
  totalMembers: 847,
  upcomingEvents: 3,
  ticketsSold: 214,
  revenue: 4280,
};

// Mock activity feed
export const mockActivity = [
  { id: "1", type: "check_in",     actor: "Nirav Pandey",      detail: "ML Workshop: Intro to PyTorch",  time: "2 min ago" },
  { id: "2", type: "membership",   actor: "Rasheed Mohammed",  detail: null,                             time: "14 min ago" },
  { id: "3", type: "ticket",       actor: "Sophie Chen",       detail: "End of Year Gala",               time: "1 hr ago" },
  { id: "4", type: "committee",    actor: "Alex Kim",          detail: null,                             time: "2 hr ago" },
  { id: "5", type: "check_in",     actor: "Priya Singh",       detail: "Data Jam Hackathon",             time: "3 hr ago" },
  { id: "6", type: "collaboration", actor: "CSSC",             detail: "End of Year Gala",               time: "5 hr ago" },
  { id: "7", type: "membership",   actor: "James Lee",         detail: null,                             time: "6 hr ago" },
  { id: "8", type: "ticket",       actor: "Mia Torres",        detail: "ML Workshop: Intro to PyTorch",  time: "8 hr ago" },
];

// Mock members
export const mockMembers = [
  { id: "1", name: "Nirav Pandey", email: "npandey@student.unimelb.edu.au", umsuEmail: "nirav.pandey@gmail.com", dateVerified: "2026-03-12", product: "DS Cubed Student Membership", status: "Verified" },
  { id: "2", name: "Rasheed Mohammed", email: "rmohammed@student.unimelb.edu.au", umsuEmail: "rasheed.m@gmail.com", dateVerified: "2026-03-14", product: "DS Cubed Student Membership", status: "Verified" },
  { id: "3", name: "Priya Singh", email: "priyasingh@student.unimelb.edu.au", umsuEmail: "priya.singh@hotmail.com", dateVerified: "2026-03-15", product: "DS Cubed Student Membership", status: "Verified" },
  { id: "4", name: "James Lee", email: "jlee@student.unimelb.edu.au", umsuEmail: "james.lee.mel@gmail.com", dateVerified: "2026-03-20", product: "DS Cubed Student Membership", status: "Verified" },
  { id: "5", name: "Sophie Chen", email: "sophiechen@student.unimelb.edu.au", umsuEmail: "sophiechen99@gmail.com", dateVerified: "2026-03-22", product: "DS Cubed Student Membership", status: "Verified" },
  { id: "6", name: "Alex Kim", email: "akim@student.unimelb.edu.au", umsuEmail: "alexkim.au@gmail.com", dateVerified: "2026-04-01", product: "DS Cubed Student Membership", status: "Verified" },
  { id: "7", name: "Mia Torres", email: "mtorres@student.unimelb.edu.au", umsuEmail: "mia.torres@gmail.com", dateVerified: "2026-04-05", product: "DS Cubed Student Membership", status: "Verified" },
];

// Mock events
export const mockEvents = [
  { id: "evt-0", name: "DS Cubed General Meeting", start: "2026-04-28T18:00:00Z", location_name: "Engineering Building, Rm 101", status: "live", is_online: false, thumbnail: null, category: "General", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 55, ticketsSold: 55, revenue: 0 },
  { id: "evt-1", name: "ML Workshop: Intro to PyTorch", start: "2026-05-10T18:00:00Z", location_name: "Engineering Building, Rm 201", status: "upcoming", is_online: false, thumbnail: null, category: "Workshop", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 42, ticketsSold: 38, revenue: 380 },
  { id: "evt-2", name: "End of Year Gala", start: "2026-06-20T19:00:00Z", location_name: "Union House Ballroom", status: "upcoming", is_online: false, thumbnail: null, category: "Social", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 120, ticketsSold: 95, revenue: 2850 },
  { id: "evt-6", name: "Resume Review Workshop", start: "2026-05-17T17:00:00Z", location_name: "Baldwin Spencer Building, Rm 3", status: "upcoming", is_online: false, thumbnail: null, category: "Workshop", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 30, ticketsSold: 28, revenue: 0 },
  { id: "evt-7", name: "Semester 2 Kickoff Social", start: "2026-07-28T15:00:00Z", location_name: "South Lawn", status: "upcoming", is_online: false, thumbnail: null, category: "Social", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 0, ticketsSold: 0, revenue: 0 },
  { id: "evt-3", name: "Data Jam Hackathon", start: "2026-04-15T09:00:00Z", location_name: "Spot 5, Melbourne Connect", status: "past", is_online: false, thumbnail: null, category: "Hackathon", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 88, ticketsSold: 80, revenue: 800 },
  { id: "evt-4", name: "Industry Networking Night", start: "2026-04-02T18:00:00Z", location_name: "Alan Gilbert Building", status: "past", is_online: false, thumbnail: null, category: "Networking", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 65, ticketsSold: 60, revenue: 600 },
  { id: "evt-5", name: "Semester Kickoff BBQ", start: "2026-05-25T12:00:00Z", location_name: "South Lawn", status: "draft", is_online: false, thumbnail: null, category: "Social", host: { id: "user-1", first_name: "Tanat", avatar_url: null }, collaborators: null, registrations: 0, ticketsSold: 0, revenue: 0 },
];

// Mock event attendees
export const mockAttendees = [
  { id: "a1", name: "Nirav Pandey", checkedIn: true },
  { id: "a2", name: "Rasheed Mohammed", checkedIn: true },
  { id: "a3", name: "Sophie Chen", checkedIn: false },
  { id: "a4", name: "James Lee", checkedIn: true },
  { id: "a5", name: "Alex Kim", checkedIn: false },
];

// Mock committee
export const mockCommittee = [
  { id: "c1", name: "Tanat Chanwangsa", email: "tchanwangsa@gmail.com", role: "President", dateJoined: "2026-01-01", isCurrentUser: true },
  { id: "c2", name: "Nirav Pandey", email: "npandey@student.unimelb.edu.au", role: "Committee Member", dateJoined: "2026-01-15", isCurrentUser: false },
  { id: "c3", name: "Sophie Chen", email: "sophiechen@student.unimelb.edu.au", role: "Committee Member", dateJoined: "2026-01-15", isCurrentUser: false },
  { id: "c4", name: "Rasheed Mohammed", email: "rmohammed@student.unimelb.edu.au", role: "Committee Member", dateJoined: "2026-02-01", isCurrentUser: false },
];

// Mock CSV preview rows
export const mockCsvPreview = [
  { name: "Nirav Pandey", studentId: "1234567", email: "npandey@student.unimelb.edu.au" },
  { name: "Sophie Chen", studentId: "2345678", email: "sophiechen@student.unimelb.edu.au" },
  { name: "Alex Kim", studentId: "3456789", email: "akim@student.unimelb.edu.au" },
  { name: "Mia Torres", studentId: "4567890", email: "mtorres@student.unimelb.edu.au" },
  { name: "James Lee", studentId: "5678901", email: "jlee@student.unimelb.edu.au" },
];
