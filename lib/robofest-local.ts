/**
 * Single source of truth for Robofest Bangladesh local-round page copy.
 * Update date/venue/fee here when Facebook or RMS announces details.
 */

export const ROBOFEST_LOCAL = {
  statusBadge: "Local Round · September 2026",
  headline: "Robofest Local Round · Bangladesh",
  lead: "Compete in Dhaka and Chittagong for a path to the Robofest World Championship",
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
} as const;

export const ROBOFEST_CATEGORIES = [
  {
    slug: "bottlesumo",
    name: "BottleSumo",
    icon: "sports_kabaddi",
    image: "/robofest/robofest.jpg",
    description:
      "Autonomous bottle-pushing: time trials, then head-to-head—no remotes.",
    skillLevel: "Beginner to intermediate",
    format: "Time trial + single elimination",
    about:
      "Push bottles off the table in a timed seed round, then fight head-to-head. Fully autonomous only.",
    highlights: [
      "Time-trial seeding, then single-elimination matches.",
      "Explorer and Innovator size/weight/motor limits.",
      "Edge and object sensors required; 3-second start delay.",
      "Win by pushing the opponent off and surviving on the table.",
    ],
    whoShouldJoin:
      "Teams building and programming their own autonomous sumo-style robot.",
    rulesPdf: "/robofest/BottleSumo%20Competition.pdf",
  },
  {
    slug: "buildathon",
    name: "Buildathon",
    icon: "construction",
    image: "/roboclass.jpg",
    description:
      "Design, build, and present a robotics project under buildathon constraints.",
    skillLevel: "Intermediate",
    format: "Project build + presentation",
    about:
      "Build a working robotics prototype under theme and time pressure, then pitch it to judges.",
    highlights: [
      "Prototype + live presentation to judges.",
      "Scored on engineering, creativity, and clarity.",
      "Hardware, software, and storytelling all count.",
      "No fixed arena game—your idea leads.",
    ],
    whoShouldJoin:
      "Teams who want to invent and present an original robotics build.",
    rulesPdf: "/robofest/BuildAthon%20Competition.pdf",
  },
  {
    slug: "line-following-bot",
    name: "Line Following Bot",
    icon: "timeline",
    image: "/feed/robotics.jpg",
    description:
      "Race an autonomous bot along a marked line—accuracy and speed win.",
    skillLevel: "Beginner to advanced",
    format: "Timed autonomous course",
    about:
      "Program your robot to track a line course as fast and clean as possible. Sensors and control tuning decide the podium.",
    highlights: [
      "Timed runs on a defined line path.",
      "Focus on sensors, control loops, and calibration.",
      "Beginners finish; advanced teams chase best times.",
      "Simple game rules—performance is everything.",
    ],
    whoShouldJoin:
      "Teams who love autonomous control, tuning, and racing the clock.",
    rulesPdf: "/robofest/Line-Following%20Bot%20Competition.pdf",
  },
  {
    slug: "robo-exhibition",
    name: "Robo Exhibition",
    icon: "lightbulb",
    image: "/olympiads/robofest.png",
    description:
      "Showcase an intelligent robotics project to judges and visitors.",
    skillLevel: "All levels",
    format: "Project showcase + demo",
    about:
      "Bring any intelligent robotics project, demo it live, and explain the impact. Judged on innovation and presentation.",
    highlights: [
      "Free theme within intelligent, autonomous robotics.",
      "Live demo plus clear explanation to judges.",
      "Scored on innovation, craft, and communication.",
      "Ideal for research-style or long-horizon school projects.",
    ],
    whoShouldJoin:
      "Teams with a distinctive project ready to show, not only race or fight.",
    rulesPdf: "/robofest/Robo-Exhibition%20Competition.pdf",
  },
] as const;

export type RobofestCategory = (typeof ROBOFEST_CATEGORIES)[number];
export type RobofestCategoryName = RobofestCategory["name"];
export type RobofestCategorySlug = RobofestCategory["slug"];

export function getRobofestCategoryBySlug(
  slug: string,
): RobofestCategory | undefined {
  return ROBOFEST_CATEGORIES.find((category) => category.slug === slug);
}

export function getRobofestCategoryHref(slug: RobofestCategorySlug): string {
  return `/robofest/${slug}`;
}

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
