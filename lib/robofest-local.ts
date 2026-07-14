/**
 * Single source of truth for Robofest Bangladesh local-round page copy.
 * Update date/venue/fee here when Facebook or RMS announces details.
 */

export const ROBOFEST_LOCAL = {
  statusBadge: "Local Round · September 2026",
  headline: "Robofest Local Round · Bangladesh",
  lead: "Compete in Dhaka and Chittagong for a path to the Robofest World Championship at Lawrence Technological University, USA.",
  dateLabel: "4–12 September 2026",
  timeLabel: null as string | null,
  venueLabel: "Dhaka & Chittagong · TBA",
  venueDetail: "Exact venues to be announced",
  hostName: "Robonauts Ltd",
  officialSite: "https://www.robofest.net/",
  categoriesUrl: "https://www.robofest.net/index.php/current-competitions/overview",
  contactHref: "/about#contact",
  placeholders: {
    schedule: "/olympiads/robofest.png",
    whyTrain: "/robofest/robofest.jpg",
    roundAccent: "/olympiads/robofest.png",
  },
  rounds: [
    {
      city: "Dhaka",
      title: "ROBOFEST BANGLADESH ROUND 2026 | DHAKA",
      dates: "4–5 September 2026",
      venueLabel: "Venue to be announced",
      image: "/robofest/dhaka.jpg",
    },
    {
      city: "Chittagong",
      title: "ROBOFEST BANGLADESH ROUND 2026 | CHITTAGONG",
      dates: "11–12 September 2026",
      venueLabel: "Venue to be announced",
      image: "/roboclass.jpg",
    },
  ],
  achievement: {
    title: "3rd Place · Senior BottleSumo",
    event: "Robofest World Championship 2026",
    location: "Lawrence Technological University, USA",
    detail:
      "A Robonauts-trained Bangladesh team earned the podium at Lawrence Technological University—proof that students from here can compete on the world stage.",
  },
} as const;

export const ROBOFEST_CATEGORIES = [
  {
    name: "Game",
    icon: "precision_manufacturing",
    description:
      "Autonomous robots complete mission tasks; unknown factors are revealed at competition.",
  },
  {
    name: "Exhibition",
    icon: "lightbulb",
    description:
      "Full creative freedom to showcase any intelligent, autonomous robotics project.",
  },
  {
    name: "BottleSumo",
    icon: "sports_kabaddi",
    description:
      "Push bottles—or your opponent—off the table in fast head-to-head matches.",
  },
  {
    name: "RoboParade",
    icon: "celebration",
    description:
      "Decorated robotic vehicles parade autonomously along a creative route.",
  },
  {
    name: "RoboArts",
    icon: "palette",
    description:
      "Robots perform, dance, paint, or make music in an interactive showcase.",
  },
  {
    name: "RoboMed",
    icon: "medical_services",
    description:
      "Intelligent biomedical robotics and device projects with real-world impact.",
  },
  {
    name: "Unknown Mission Challenge",
    icon: "psychology",
    description:
      "Build and program on the spot to solve totally unknown missions in two hours.",
  },
  {
    name: "Vision Centric Challenge",
    icon: "visibility",
    description:
      "Advanced senior division using vision-based autonomous robots.",
  },
] as const;

export const ROBOFEST_HOW_IT_WORKS = [
  {
    icon: "group",
    title: "Form a team",
    description:
      "Students in grades 4–12 join Junior or Senior divisions and pick a competition category.",
  },
  {
    icon: "smart_toy",
    title: "Build & program",
    description:
      "Design fully autonomous robots—no remote control during matches. Any approved kit and language welcome.",
  },
  {
    icon: "flag",
    title: "Compete in Bangladesh",
    description:
      "Join the local rounds in Dhaka or Chittagong, hosted by Robonauts, and showcase your robot on home turf.",
  },
  {
    icon: "public",
    title: "Aim for the World Championship",
    description:
      "Top qualifying teams earn a path to the Robofest World Championship at Lawrence Technological University, USA.",
  },
] as const;

export type RobofestEventFact = {
  icon: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
};
