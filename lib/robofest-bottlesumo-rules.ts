/**
 * BottleSumo local-round rules (RF26.CMP.02) for on-page display.
 * Full document: public/robofest/BottleSumo Competition.pdf
 */

export const BOTTLESUMO_RULES = {
  ref: "RF26.CMP.02",
  date: "04.08.2026",
  title: "BottleSumo Competition — Rules & Guidelines",
  contact: {
    name: "Md Shourov Hasan",
    role: "Academics Team Lead · RoboFest Bangladesh 2026",
    email: "events@robonautsltd.com",
    phone: "+880 1897-666864",
  },
  rounds: [
    {
      name: "Time Trial",
      purpose:
        "Robots push bottles off the table individually. Used to rank robots and seed the tournament bracket.",
    },
    {
      name: "Single Elimination",
      purpose: "Head-to-head matches with no bottles involved.",
    },
  ],
  definitions: [
    {
      term: "Game",
      meaning: "A single head-to-head round between two robots.",
    },
    {
      term: "Match",
      meaning: "A series of games (best of 3) to determine which team advances.",
    },
    {
      term: "Match Winner",
      meaning: "The first team to win two (2) games.",
    },
    {
      term: "Robot Fall",
      meaning:
        "The moment the robot’s main chassis loses all contact with the table and any part of it touches the floor. A robot still touching the table with at least one contact point has not fallen.",
    },
    {
      term: "Bottle Fall / Bottle Off Table",
      meaning:
        "The moment no part of the bottle’s base remains in contact with the table, regardless of whether it has reached the floor yet.",
    },
    {
      term: "Intact",
      meaning:
        "No functionally significant part (locomotion, sensing, or strategy component) has detached from the robot.",
    },
  ],
  generalRules: [
    "Robots must be designed, built, and programmed by student team members. Mentors may guide and teach but may not build or code the competition robot.",
    "Substantially similar robots (including from the same school) may face investigation and possible penalty or disqualification.",
    "The robot must be fully constructed, functional, and autonomous on arrival—no remote control, Bluetooth/Wi-Fi tele-operation, or human signalling once a match starts.",
    "One robot per team for the entire competition.",
    "Labelling: Team ID clearly visible; a permanent “Front” marking on the primary-sensor side for the whole event.",
    "Teams bring their own laptop/computer and charging cable to modify code between rounds.",
  ],
  specs: {
    columns: ["Specification", "Explorer", "Innovator"] as const,
    rows: [
      ["Maximum robot weight", "2.5 kg", "3.0 kg"],
      ["Maximum robot size", "20 × 20 × 20 cm box", "30 × 30 × 30 cm box"],
      [
        "Expansion after start",
        "Allowed if within max box size at all times",
        "Allowed if within max box size at all times",
      ],
      ["Number of motors", "Maximum 2", "Maximum 4 (drive + mechanism)"],
      ["Number of sensors", "Maximum 3", "No limit"],
      ["Battery voltage limit", "≤ 11.1V (e.g. 3S Li-ion/LiPo)", "≤ 12.6V"],
      ["Microcontroller / brain", "One only", "No limit"],
      [
        "Wheels / treads / legs",
        "Standard wheels or tank treads only. No vacuum, suction, or sticky/adhesive material.",
        "Same",
      ],
      [
        "Robot shape",
        "Edges below 25 mm from the ground must not be sloped or shaped as a ramp. All motors must remain visible/accessible for inspection.",
        "Same",
      ],
      [
        "On-board camera / vision",
        "Not allowed",
        "Allowed (e.g. ESP32-CAM, smartphone-based vision)",
      ],
    ] as const,
  },
  sensorMotorNotes: [
    "Every robot must have at least one edge/line sensor (table-edge contrast) and at least one object-detection sensor (ultrasonic, IR, or ToF) for an opponent or bottle ahead.",
    "Any motor type is allowed (DC gear, servo, stepper) within the category’s motor count and voltage limits.",
    "Any construction material is allowed: plywood, acrylic, PVC, 3D-printed plastic, cardboard reinforced with glue, aluminium sheet, etc. Tape, glue, screws, and rubber bands may be used freely.",
  ],
  field: [
    "Standard rectangular table, approximately 75 cm × 150–180 cm (classroom table, two desks pushed together, or 4×8 ft plywood on sawhorses).",
    "Light-colored surface (white, gray, beige, or light brown), reasonably flat and smooth; may be covered with matte non-glossy sheet if needed.",
    "Exact color/brightness confirmed on competition day—use adjustable sensor thresholds, not hard-coded values.",
    "No walls, lip, or barrier—all edges are open drop-offs.",
  ],
  bottles: [
    "Standard 2-liter plastic soft-drink bottle, wrapped in red paper, filled with sand or fine gravel.",
    "Explorer fill weight: 0.5 kg · Innovator fill weight: 1.0 kg.",
    "Five (5) bottles every time-trial run; exact red shade disclosed on competition day—rely on contrast, not a fixed color code.",
    "Positions set by the judge before each round and identical for every team: no bottle within 15 cm of an edge; no two bottles within 20 cm of each other.",
  ],
  startTask: [
    "Every robot must have a 3-second delay before any part begins to move (time trials and head-to-head).",
    "All calibration (sensor thresholds, motor speeds, opening motion) must be preprogrammed before impounding ends—no on-field button-press calibration after impound.",
    "Same start method (button/switch) for the entire event; any preset opening motion must be identical every game.",
  ],
  competitionDay: [
    "Only registered participants may access the pit area, team tables, and practice/competition fields during setup, work time, and breaks.",
    "After the opening ceremony, a 15-minute work period for final adjustments.",
    "Then inspection (weight, size, labelling) and impound. Judges record the start method. Battery charging is not allowed during impound.",
    "Do not touch the robot until instructed by a judge.",
    "After a time-trial run, the robot is held by the pit judge until the official 15-minute group adjustment window before the bracket is finalized.",
  ],
  timeTrial: [
    "Judge announces starting location and orientation (same for all teams). Bottle positions announced after impound.",
    "Time to push all 5 bottles off, to 1/100th of a second. Maximum: 2 minutes (120 seconds).",
    "If the robot falls or fails to clear all bottles, survival time and bottles pushed are recorded instead.",
    "Stability: the robot must remain intact and on the table for at least 3 seconds after a bottle is pushed off before that push is final. The 3-second check does not count toward recorded time.",
    "Falling off during the 3-second window: that bottle still counts; a flat +5 second penalty is added to survival time for seeding.",
    "Timing stops at the earliest of: 5th bottle off (completion time), robot falls (survival time), or 2-minute mark.",
    "Seeding: successful start task → bottles pushed off → 3-second survival after last push → completion or survival time.",
  ],
  headToHead: [
    "Maximum 2 minutes per game. Judge announces location and orientation of both robots (may differ game to game).",
    "3-second start delay required. Failing to move or failing the delay = automatic loss (tie if both fail).",
    "Students and judges stay at least 1 meter from table edges until the game ends.",
    "If a functionally significant part detaches and falls to the floor, the opposing robot wins immediately (cosmetic parts do not trigger this).",
    "One battery swap allowed per match at the judge’s discretion.",
    "Between games in a match: repairs of existing components only—no new parts, no code or recalibration changes. Judge must confirm and log the repair.",
  ],
  winConditions: [
    "Satisfies the start task while the opponent fails it.",
    "Pushes the opponent off and remains intact on the table for at least 3 seconds.",
    "Remains intact on the table for at least 3 seconds after the opponent falls or drives off (including self-elimination).",
    "Opponent has a functionally significant part detach.",
    "Unclear outcome → tie (see tiebreakers).",
  ],
  ties: [
    "Both robots touch the floor at the same moment (except detached-part rule).",
    "Both fall within 3 seconds of each other.",
    "No progress for 20 seconds (judge’s discretion).",
    "Both fail to move / both fail start task / one fails to move and the other fails start task.",
    "No winner after 2 minutes, or result genuinely unclear.",
    "Match tied after 3 games: compare time-trial results → up to 2 extra games if still tied → single-bottle mini time trial.",
  ],
  faq: [
    {
      q: "Can our robot have multiple programs to choose from at the start?",
      a: "No. The same program and start method must be used for every game.",
    },
    {
      q: "Robot A pushes Robot B off, but A also falls before 3 seconds. Who wins?",
      a: "Tie game.",
    },
    {
      q: "Can Explorers use block-based coding (Scratch/mBlock) instead of C++?",
      a: "Yes. Any programming language or environment is allowed in every division.",
    },
    {
      q: "Is it okay if our robot expands after the game starts?",
      a: "Yes, as long as it never exceeds the maximum box size for its category.",
    },
    {
      q: "Are pneumatics or flywheel mechanisms allowed?",
      a: "Yes, in all categories, within size, weight, motor count, and safety rules.",
    },
  ],
} as const;
