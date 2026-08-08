/**
 * Robo Exhibition local-round rules (RF26.CMP.05) for on-page display.
 * Full document: public/robofest/Robo-Exhibition Competition.pdf
 */

import {
  ROBOFEST_RULES_CONTACT,
  type RobofestCategoryRulesPackage,
} from "@/lib/robofest-rules-types";

export const ROBO_EXHIBITION_RULES: RobofestCategoryRulesPackage = {
  slug: "robo-exhibition",
  ref: "RF26.CMP.05",
  date: "04.08.2026",
  title: "Robo-Exhibition — Rules & Guidelines",
  summary:
    "Inter-school project exhibition: display & safety check, then timed judging presentation and Q&A.",
  downloadFilename: "Robo-Exhibition-Competition-Rules.pdf",
  contact: ROBOFEST_RULES_CONTACT,
  sections: [
    {
      kind: "namedList",
      title: "Competition format",
      items: [
        {
          name: "Display & safety inspection",
          detail:
            "Projects are set up, checked for compliance, and made ready for public viewing.",
        },
        {
          name: "Judging round",
          detail:
            "Judges visit each team for a timed presentation and Q&A, then score against the rubric.",
        },
      ],
    },
    {
      kind: "definitions",
      title: "Key definitions",
      items: [
        {
          term: "Project",
          meaning:
            "The physical model/prototype built by a team, along with its display board.",
        },
        {
          term: "Presentation",
          meaning:
            "A team’s 5-minute verbal walkthrough of their project, followed by Q&A.",
        },
      ],
    },
    {
      kind: "bullets",
      title: "Themes (choose one at registration)",
      items: [
        "Robots for disaster response & rescue",
        "Assistive robotics for accessibility & elderly care",
        "Robotics in space exploration",
        "Home & industrial automation (smart living)",
        "Underwater / marine robotics",
        "Eco-robotics: waste management & sustainability",
        "Future of transportation (autonomous vehicles/drones)",
        "Health-tech",
        "Open innovation or innovative solutions",
        "Theme must tie back to robotics, automation, or intelligent systems. Theme is locked after the registration deadline.",
      ],
    },
    {
      kind: "bullets",
      title: "Project requirements",
      items: [
        "Designed and built by student team members; mentors may guide/teach but not build.",
        "Substantially similar projects may face investigation and penalty or disqualification.",
        "Fully constructed and ready for display on arrival; one project per team.",
        "Labelling: Team ID on the display board; theme and project title clearly labelled.",
        "Bring digital files (slides/abstract) on your own device if needed.",
        "Electronics optional but encouraged (≤12V DC only; no mains/AC). No open flames, combustion engines, lasers above Class 2, or pressurized gas.",
        "Wiring must be secured/insulated. Prohibited: sharp uncovered edges, glass, live animals, hazardous chemicals, aerosols, drones/flying parts, >12V or mains power.",
        "Mandatory safety check-in 1 hour before judging; non-compliant projects must be fixed or are barred.",
        "At least 60% of the visible structure must be cardboard-based; other materials are supplementary.",
      ],
    },
    {
      kind: "bullets",
      title: "Presentation requirements",
      items: [
        "Physical model/prototype plus project board or tri-fold (max 90 cm × 120 cm): problem, objective, design process, how it works, real-world application, future scope.",
        "Verbal presentation: 5 minutes per team, then 3-minute Q&A.",
        "All team members must participate in some capacity.",
        "English or Bengali; clarity is scored either way.",
      ],
    },
    {
      kind: "table",
      title: "Judging rubrics (100 points)",
      columns: ["Criterion", "Points"],
      rows: [
        ["Innovation & originality", "20"],
        ["Technical understanding", "20"],
        ["Craftsmanship & build quality", "15"],
        ["Functionality / working mechanism", "15"],
        ["Relevance to theme", "10"],
        ["Presentation & communication", "10"],
        ["Practicality & real-world impact", "5"],
        ["Teamwork", "5"],
      ],
      notes: [
        "Tie-breaker: highest Innovation & Originality, then Technical Understanding.",
        "1st–3rd place receive certificates and medals.",
      ],
    },
    {
      kind: "faq",
      title: "FAQ",
      items: [
        {
          q: "Does our project need working electronics to be competitive?",
          a: "No. Functionality is only 15 of 100 points. A strong static model with excellent presentation can still score highly.",
        },
        {
          q: "Can we use materials other than cardboard for the whole project?",
          a: "No. At least 60% of the visible structure must be cardboard-based; other materials are supplementary.",
        },
        {
          q: "Can our mentor help solder or wire electronics?",
          a: "Mentors may guide and teach, but may not build or assemble the project. Excessive involvement may trigger a design interview.",
        },
        {
          q: "What if our display board exceeds the size limit?",
          a: "It must be resized during the safety/compliance check before judging, or the team may be barred.",
        },
        {
          q: "Can we change our theme after registering?",
          a: "No. Theme selection is locked at the registration deadline.",
        },
      ],
    },
  ],
};
