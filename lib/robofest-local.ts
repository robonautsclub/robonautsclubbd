/**
 * Single source of truth for Robofest Bangladesh local-round page copy.
 * Update date/venue/fee here when Facebook or RMS announces details.
 */

export const ROBOFEST_LOCAL = {
  statusBadge: "Local Round · September 2026",
  presentsLabel: "Robonauts Ltd Presents",
  headline: "RoboFest Bangladesh 2026",
  lead: "Compete in Dhaka & Chittagong for a Path to the RoboFest World Championship 2027 in South Korea.",
  dateLabel: "11 September (CTG) · 18 September (DHK)",
  timeLabel: null as string | null,
  venueLabel: "Chittagong · TBA · Dhaka · TBA",
  venueDetail: "Exact venues to be announced",
  hostName: "Robonauts Ltd",
  officialSite: "https://www.robofest.net/",
  categoriesUrl: "https://www.robofest.net/index.php/current-competitions/overview",
  generalRulesPdf: "/robofest/General%20Rules%20%26%20Regulations.pdf",
  instagramUrl:
    "https://www.instagram.com/robonautsltd?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  contactHref: "/about#contact",
  contactEmail: "events@robonautsltd.com",
  contactLines: [
    {
      label: "Contact - 01",
      phone: "+880 1897-666864",
      note: "Competitions Related",
    },
    {
      label: "Contact - 02",
      phone: "+880 1954-954047",
      note: "Registrations Related",
    },
  ],
  dateLines: ["11 September (CTG)", "18 September (DHK)"],
  venueLines: ["Chittagong - TBA", "Dhaka - TBA"],
  placeholders: {
    schedule: "/olympiads/robofest.png",
    roundAccent: "/olympiads/robofest.png",
  },
  rounds: [
    {
      city: "Chittagong",
      title: "ROBOFEST BANGLADESH ROUND 2026 | CHITTAGONG",
      dates: "11 September (CTG)",
      venueLabel: "Chittagong - TBA",
      image: "/roboclass.jpg",
    },
    {
      city: "Dhaka",
      title: "ROBOFEST BANGLADESH ROUND 2026 | DHAKA",
      dates: "18 September (DHK)",
      venueLabel: "Dhaka - TBA",
      image: "/robofest/dhaka.jpg",
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
    title: "Form Your Team",
    description:
      "Students in Grades 05 - 12 compete under Explorer (Grades 05 - 08) or Innovators (Grades 09 - 12) and form a Team of up to 4 Members.",
  },
  {
    icon: "smart_toy",
    title: "Choose Your Competition",
    description:
      "Select from BottleSumo, Line-Following Bot, BuildAthon, or Robo-Exhibition, based on your Team's Interests & Skills.",
  },
  {
    icon: "flag",
    title: "Compete in the Local Round",
    description:
      "Compete in Dhaka or Chattogram under the Rules & Judging Format of your Selected Competition.",
  },
  {
    icon: "public",
    title: "Path to the World Stage",
    description:
      "Outstanding Teams may earn the opportunity to represent Bangladesh at the Robofest World Championship 2027 in Seoul, South Korea.",
  },
] as const;

export type RobofestEventFact = {
  icon: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
};
