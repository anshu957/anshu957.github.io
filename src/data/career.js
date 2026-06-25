// Shared career trajectory data — single source of truth for the desktop
// CareerMap island and the static mobile fallback list on the About page.

export const careerNodes = [
  { id: "nsit",    year: 2009, t: 0.10, period: "2005–09", role: "B.E., Engineering",               inst: "NSIT",                    loc: "Delhi, India",       type: "edu"      },
  { id: "iiser",   year: 2016, t: 0.20, period: "2011–16", role: "Ph.D., Physics",                  inst: "IISER Mohali",            loc: "Mohali, India",      type: "edu"      },
  { id: "olden",   year: 2018, t: 0.44, period: "2016–18", role: "Postdoctoral Researcher",         inst: "University of Oldenburg", loc: "Oldenburg, Germany", type: "research" },
  { id: "ncstate", year: 2022, t: 0.63, period: "2019–22", role: "Postdoctoral Researcher",         inst: "NC State · NAIL",         loc: "Raleigh, NC, USA",   type: "research" },
  { id: "jax",     year: 2025, t: 0.82, period: "2022–",   role: "Assoc. Computational Scientist",  inst: "The Jackson Laboratory",  loc: "Farmington, CT",     type: "current"  },
];

// edu = theory (blue), research = methods (sage), current = now/biology (oxide)
export const careerTypeColor = {
  edu: "var(--accent-blue)",
  research: "var(--sage)",
  current: "var(--oxide)",
};
