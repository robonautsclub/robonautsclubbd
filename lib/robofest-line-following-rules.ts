/**
 * Line-Following Bot local-round rules (RF26.CMP.04) for on-page display.
 * Full document: public/robofest/Line-Following Bot Competition.pdf
 */

import {
  ROBOFEST_RULES_CONTACT,
  type RobofestCategoryRulesPackage,
} from "@/lib/robofest-rules-types";

export const LINE_FOLLOWING_RULES: RobofestCategoryRulesPackage = {
  slug: "line-following-bot",
  ref: "RF26.CMP.04",
  date: "04.08.2026",
  title: "Line-Following Bot Competition — Rules & Guidelines",
  summary:
    "Qualification time trial seeding, then best-of-1 head-to-head showdowns on mirrored tracks.",
  downloadFilename: "Line-Following-Bot-Competition-Rules.pdf",
  contact: ROBOFEST_RULES_CONTACT,
  sections: [
    {
      kind: "namedList",
      title: "Competition rounds",
      items: [
        {
          name: "Qualification time trial",
          detail: "Each team completes one individual run used for seeding.",
        },
        {
          name: "Single elimination showdown",
          detail: "Best-of-1 head-to-head race on identical mirrored tracks.",
        },
      ],
    },
    {
      kind: "definitions",
      title: "Key definitions",
      items: [
        { term: "Run", meaning: "A single attempt to complete the course." },
        { term: "Race", meaning: "A single head-to-head showdown." },
        {
          term: "Showdown",
          meaning: "A knockout race where the winner advances.",
        },
        {
          term: "Qualification ranking",
          meaning: "The final seeding after the time trial.",
        },
      ],
    },
    {
      kind: "bullets",
      title: "General robot rules",
      items: [
        "Robots must be designed, built, and programmed by student team members. Mentors may teach but may not build or program.",
        "Fully autonomous after the start signal—no remote control or tele-operation.",
        "One robot per team; Team Name must be visible on the robot.",
        "Teams bring their own laptop and charger for programming.",
      ],
    },
    {
      kind: "bullets",
      title: "Robot specifications",
      items: [
        "Maximum dimensions for both categories: 24 cm length × 24 cm width × 24 cm height.",
        "Use components commonly available in Bangladesh (e.g. Arduino Uno/Nano, ESP32, TCRT5000/QTR sensors, BO/N20/TT gear motors, L298N/TB6612, 18650 packs).",
        "Cameras and vision-based navigation are not permitted.",
        "Any safe construction material: acrylic, plywood, PVC, aluminium, 3D-printed or recycled parts.",
      ],
    },
    {
      kind: "bullets",
      title: "Playing field & course",
      items: [
        "Two identical mirrored line-following tracks for showdowns; time trials use one track (duplicates may be used for speed).",
        "Exact layout is unpublished before the event; general specs in the rulebook remain consistent.",
        "Flat rigid surface (plywood/MDF/laminate); continuous black line on white surface—calibrate for lighting variation.",
        "Possible elements: straights, gentle curves, 45°/90° turns, S-curves, hairpins, acceleration zones, finish zone.",
        "Checkpoints track progress; leaving the line may allow restart from last checkpoint with a time penalty.",
        "Start: robot fully inside the start box, facing the judge-specified direction.",
        "Finish: 30 × 30 cm solid matte black rectangular zone over the guideline.",
      ],
    },
    {
      kind: "bullets",
      title: "Start task & timing",
      items: [
        "Robot must remain stationary for 3 seconds after start before any movement (time trial and showdown).",
        "Same start button/switch/procedure for the whole event.",
        "Failing the start task lowers seeding in qualification, or loses/ties the showdown race.",
        "Maximum time: 2 minutes for qualification; 3 minutes for showdown.",
        "Only one participant may stay on the course; repositioning allowed only if the robot leaves or a checkpoint is skipped—no pushing.",
      ],
    },
    {
      kind: "bullets",
      title: "Competition day & qualification",
      items: [
        "15-minute work period after opening ceremony (hardware, programs, batteries), then inspection (size, ID, safety, autonomy).",
        "Each team runs one qualification attempt; timing to 1/100th of a second when possible.",
        "Leaving the course: restart from nearest checkpoint up to three times, each with a time penalty.",
        "After all qualifications: 15-minute pre-showdown work window, then official rankings and bracket.",
        "Seeding order: start task success → course completion → fastest valid time → most checkpoints completed.",
      ],
    },
  ],
};
