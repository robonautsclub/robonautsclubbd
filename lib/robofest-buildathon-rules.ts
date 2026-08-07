/**
 * Buildathon local-round rules (RF26.CMP.03) for on-page display.
 * Full document: public/robofest/BuildAthon Competition.pdf
 */

import {
  ROBOFEST_RULES_CONTACT,
  type RobofestCategoryRulesPackage,
} from "@/lib/robofest-rules-types";

export const BUILDATHON_RULES: RobofestCategoryRulesPackage = {
  slug: "buildathon",
  ref: "RF26.CMP.03",
  date: "04.08.2026",
  title: "BuildAthon Competition — Rules & Guidelines",
  summary:
    "Two-round hackathon: online prelims, then a 2-hour on-site build and pitch for the top 10.",
  downloadFilename: "BuildAthon-Competition-Rules.pdf",
  contact: ROBOFEST_RULES_CONTACT,
  sections: [
    {
      kind: "namedList",
      title: "Competition rounds",
      items: [
        {
          name: "Preliminary (online)",
          detail:
            "Teams submit and may modify until the deadline. Judges select the top 10 and share feedback.",
        },
        {
          name: "Final (offline)",
          detail:
            "Invited teams create and pitch on-site with a maximum of 2 hours to build and finalise their project.",
        },
      ],
    },
    {
      kind: "bullets",
      title: "General rules & deliverables",
      items: [
        "Team composition: maximum 4 participants per team.",
        "Originality: code, designs, and assets must be developed during the hackathon. Disclose pre-existing open-source libraries at on-site submission.",
        "Code repository: public or shared GitHub/GitLab link required, showing active commit history.",
        "No limit on languages or frameworks. Extensive AI use without documentation or understanding is not allowed.",
        "Physical demonstration is optional; hardware/IoT prototypes may present physical components. Simulations and UI walkthroughs are evaluated equally—extra points for a physical demo.",
        "Deliverables: functional prototype link/executable/simulation; ~3-minute video demo; system architecture diagram (tech stack, APIs, data workflows); feasibility & scalability doc (max 1 page or 3 slides).",
      ],
    },
    {
      kind: "bullets",
      title: "Core programmatic pillars",
      items: [
        "Sustainability embedded: minimize computational waste, align with UN SDGs; hardware should consider component lifecycles.",
        "Feasibility: realistic infrastructure and regulatory boundaries; documentation must show viable unit economics and a deployment roadmap.",
        "Scalability: architecture must handle growth without compounding technical debt (modular code, microservices, or efficient indexing).",
      ],
    },
    {
      kind: "namedList",
      title: "Track-specific guidelines",
      items: [
        {
          name: "Track A · Education (EdTech)",
          detail:
            "Scalable solutions for learning gaps, accessibility, personalized curriculum, or admin optimization. Low-power delivery; open-source / low-cost device compatibility; privacy (COPPA/GDPR-like)—no unencrypted PII.",
        },
        {
          name: "Track B · Healthcare (HealthTech)",
          detail:
            "Patient care, diagnostics, medical data, or mental-health tools. Reduce admin waste; HL7/FHIR-style interoperability; separate data layers (HIPAA-like) using synthetic datasets.",
        },
        {
          name: "Track C · Agritech",
          detail:
            "Supply chain, yield prediction, precision farming, pest detection, or resource management. Resource conservation focus; edge / low-connectivity (offline-first). Optional hardware should specify scalable protocols (e.g. MQTT, LoRaWAN).",
        },
      ],
    },
    {
      kind: "table",
      title: "Evaluation rubric",
      columns: ["Criteria", "Weight", "Description"],
      rows: [
        [
          "Technical complexity & scalability",
          "30%",
          "Architecture, code quality, database design, capacity for scaled loads",
        ],
        [
          "Feasibility & implementation",
          "25%",
          "Real-world viability, cost efficiency, deployment ease, track constraints",
        ],
        [
          "Sustainability integration",
          "20%",
          "Environmental / resource-efficiency alignment and computational efficiency",
        ],
        [
          "Innovation & originality",
          "15%",
          "Novelty vs commercial alternatives; meaningful git commits",
        ],
        [
          "UX/UI & presentation",
          "10%",
          "Workspace logic, interface clarity, 3-minute video/demo execution",
        ],
      ],
    },
    {
      kind: "bullets",
      title: "Disqualification criteria",
      items: [
        "Missing repository link or lack of commit logs during the hacking window.",
        "Plagiarized codebases or undocumented use of proprietary third-party IP.",
        "Concurrent submission to multiple tracks.",
        "Extensive AI usage with no documentation.",
      ],
    },
  ],
};
