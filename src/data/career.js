/** Career milestones for the About timeline (chronological order). */

/** @typedef {{ id: string, period: string, years: string, role: string, inst: string, loc: string, note: string, yearStart: number, type: "edu"|"research"|"current" }} CareerNode */

/** @type {CareerNode[]} */
export const careerNodes = [
  {
    id: "nsit",
    period: "2005–09",
    years: "2005 – 2009",
    yearStart: 2005,
    role: "B.E., Engineering",
    inst: "NSIT",
    loc: "Delhi, India",
    note: "Engineering foundations before the pull toward physics.",
    type: "edu",
  },
  {
    id: "iiser",
    period: "2011–16",
    years: "2011 – 2016",
    yearStart: 2011,
    role: "Ph.D., Physics",
    inst: "IISER Mohali",
    loc: "Mohali, India",
    note: "Dynamical systems on complex networks — where the mathematics settled in.",
    type: "edu",
  },
  {
    id: "olden",
    period: "2016–18",
    years: "2016 – 2018",
    yearStart: 2016,
    role: "Postdoctoral Researcher",
    inst: "University of Oldenburg",
    loc: "Oldenburg, Germany",
    note: "Wind, turbines, and stochastic resonance by the North Sea.",
    type: "research",
  },
  {
    id: "ncstate",
    period: "2019–22",
    years: "2019 – 2022",
    yearStart: 2019,
    role: "Postdoctoral Researcher",
    inst: "NC State · NAIL",
    loc: "Raleigh, NC",
    note: "Physics-aware machine learning in the American South.",
    type: "research",
  },
  {
    id: "jax",
    period: "2022–",
    years: "2022 – now",
    yearStart: 2022,
    role: "Assoc. Computational Scientist",
    inst: "The Jackson Laboratory",
    loc: "Farmington, CT",
    note: "Cell fate, RNA velocity, and dynamical systems meet genomics.",
    type: "current",
  },
];
