/**
 * Shared shape for on-page Robofest category rules.
 */

export type RobofestRulesContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
};

export type RobofestRulesSection =
  | {
      kind: "namedList";
      title: string;
      items: readonly { name: string; detail: string }[];
    }
  | {
      kind: "definitions";
      title: string;
      items: readonly { term: string; meaning: string }[];
    }
  | {
      kind: "bullets";
      title: string;
      items: readonly string[];
    }
  | {
      kind: "table";
      title: string;
      columns: readonly string[];
      rows: readonly (readonly string[])[];
      notes?: readonly string[];
    }
  | {
      kind: "faq";
      title: string;
      items: readonly { q: string; a: string }[];
    };

export type RobofestCategoryRulesPackage = {
  slug: string;
  ref: string;
  date: string;
  title: string;
  summary: string;
  downloadFilename: string;
  contact: RobofestRulesContact;
  sections: readonly RobofestRulesSection[];
};

export const ROBOFEST_RULES_CONTACT: RobofestRulesContact = {
  name: "Md Shourov Hasan",
  role: "Academics Team Lead · RoboFest Bangladesh 2026",
  email: "events@robonautsltd.com",
  phone: "+880 1897-666864",
};
