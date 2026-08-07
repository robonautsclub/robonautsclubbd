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
      "Push bottles off a rectangular table in time trials, then face rivals head-to-head—no remote control.",
    skillLevel: "Beginner to intermediate",
    format: "Time trial + single elimination",
    about:
      "BottleSumo is a two-round autonomous challenge on an open rectangular table (~75 × 150–180 cm). Teams first push five sand-filled bottles off the table in a timed trial that seeds the bracket, then compete head-to-head (best of 3) with no bottles. Explorer and Innovator divisions set different size, weight, and motor limits.",
    highlights: [
      "Robots must wait 3 seconds after start before moving—same program and start method every game.",
      "Every robot needs at least one edge/line sensor and one object-detection sensor.",
      "Explorer (≤2.5 kg, 20 cm box, 2 motors) and Innovator (≤3.0 kg, 30 cm box, 4 motors) categories.",
      "Time-trial seeding, then single-elimination matches decided by pushing the opponent off and surviving 3 seconds.",
    ],
    whoShouldJoin:
      "Student teams who design, build, and program their own autonomous robot—especially those ready to iterate between time trials and bracket matches.",
    rulesPdf: "/robofest/BottleSumo%20Competition.pdf",
  },
  {
    slug: "buildathon",
    name: "Buildathon",
    icon: "construction",
    image: "/roboclass.jpg",
    description:
      "Design, build, and present a robotics project under buildathon-style constraints.",
    skillLevel: "Intermediate",
    format: "Project build + presentation",
    about:
      "Buildathon challenges teams to design, assemble, and present a robotics project under time and theme constraints. Judges look for creativity, engineering process, and how well your team explains the work.",
    highlights: [
      "Form a team idea, build a working prototype, and present to judges.",
      "Balanced focus on hardware, software, and storytelling.",
      "Encourages collaboration, planning, and rapid problem-solving.",
      "Showcase originality—solutions do not need to fit a fixed arena game.",
    ],
    whoShouldJoin:
      "Teams that enjoy design thinking and building something original rather than purely scoring points in a fixed game.",
    rulesPdf: "/robofest/BuildAthon%20Competition.pdf",
  },
  {
    slug: "line-following-bot",
    name: "Line Following Bot",
    icon: "timeline",
    image: "/feed/robotics.jpg",
    description:
      "Program an autonomous robot to follow a line course accurately and quickly.",
    skillLevel: "Beginner to advanced",
    format: "Timed autonomous course",
    about:
      "Line Following Bot tests how precisely and quickly your autonomous robot can track a marked course. Success depends on sensor placement, PID (or similar) control, and reliable calibration under real conditions.",
    highlights: [
      "Run on a defined line path; optimize for accuracy and speed.",
      "Strong learning outcomes in sensors, control loops, and tuning.",
      "Scalable difficulty—beginners finish the course; advanced teams chase best times.",
      "Minimal game rules overhead: focus on robot performance.",
    ],
    whoShouldJoin:
      "Teams who want a pure autonomous-control challenge and enjoy systematic tuning and testing.",
    rulesPdf: "/robofest/Line-Following%20Bot%20Competition.pdf",
  },
  {
    slug: "robo-exhibition",
    name: "Robo Exhibition",
    icon: "lightbulb",
    image: "/olympiads/robofest.png",
    description:
      "Showcase an intelligent, creative robotics project to judges and visitors.",
    skillLevel: "All levels",
    format: "Project showcase + demo",
    about:
      "Robo Exhibition gives you creative freedom to present any intelligent robotics project. Demonstrate capability, impact, and craftsmanship to judges and visitors—from assistive devices to artful autonomous systems.",
    highlights: [
      "Free choice of theme within intelligent, autonomous robotics.",
      "Judged on innovation, demonstration quality, and clarity of explanation.",
      "Ideal for research-style or long-horizon school projects.",
      "Practice real-world presentation skills alongside engineering.",
    ],
    whoShouldJoin:
      "Teams with a distinctive project idea who want to share it rather than compete only on speed or wins.",
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
