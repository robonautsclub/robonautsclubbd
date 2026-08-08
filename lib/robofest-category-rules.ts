/**
 * Registry: slug → on-page rules package for Robofest category pages.
 */

import { BOTTLESUMO_RULES } from "@/lib/robofest-bottlesumo-rules";
import { BUILDATHON_RULES } from "@/lib/robofest-buildathon-rules";
import { LINE_FOLLOWING_RULES } from "@/lib/robofest-line-following-rules";
import { ROBO_EXHIBITION_RULES } from "@/lib/robofest-robo-exhibition-rules";
import {
  ROBOFEST_RULES_CONTACT,
  type RobofestCategoryRulesPackage,
} from "@/lib/robofest-rules-types";

function bottlesumoAsPackage(): RobofestCategoryRulesPackage {
  const r = BOTTLESUMO_RULES;
  return {
    slug: "bottlesumo",
    ref: r.ref,
    date: r.date,
    title: r.title,
    summary:
      "Time trial seeding with bottles, then single-elimination head-to-head on an open rectangular table.",
    downloadFilename: "BottleSumo-Competition-Rules.pdf",
    contact: ROBOFEST_RULES_CONTACT,
    sections: [
      {
        kind: "namedList",
        title: "Competition rounds",
        items: r.rounds.map((item) => ({
          name: item.name,
          detail: item.purpose,
        })),
      },
      {
        kind: "definitions",
        title: "Key definitions",
        items: r.definitions,
      },
      {
        kind: "bullets",
        title: "General robot rules",
        items: r.generalRules,
      },
      {
        kind: "table",
        title: "Category specifications",
        columns: [...r.specs.columns],
        rows: r.specs.rows.map((row) => [...row]),
        notes: [...r.sensorMotorNotes],
      },
      { kind: "bullets", title: "Playing field", items: r.field },
      { kind: "bullets", title: "Bottles (time trial)", items: r.bottles },
      { kind: "bullets", title: "Robot start task", items: r.startTask },
      {
        kind: "bullets",
        title: "Competition day procedures",
        items: r.competitionDay,
      },
      { kind: "bullets", title: "Time trial round", items: r.timeTrial },
      { kind: "bullets", title: "Head-to-head games", items: r.headToHead },
      { kind: "bullets", title: "Winning a game", items: r.winConditions },
      { kind: "bullets", title: "Ties & tiebreakers", items: r.ties },
      { kind: "faq", title: "FAQ", items: r.faq },
    ],
  };
}

const RULES_BY_SLUG: Record<string, RobofestCategoryRulesPackage> = {
  bottlesumo: bottlesumoAsPackage(),
  buildathon: BUILDATHON_RULES,
  "line-following-bot": LINE_FOLLOWING_RULES,
  "robo-exhibition": ROBO_EXHIBITION_RULES,
};

export function getRobofestCategoryRules(
  slug: string,
): RobofestCategoryRulesPackage | undefined {
  return RULES_BY_SLUG[slug];
}
