export const researchThemes = [
  {
    title: "Cell fate and transcriptomic dynamics",
    body:
      "Building dynamical-systems views of cellular transitions using RNA velocity, attractors, basins, and transcriptome-wide vector fields.",
  },
  {
    title: "Behavioral phenotyping and machine learning",
    body:
      "Designing end-to-end computational tools that make automated mouse behavior analysis practical, reproducible, and genetically informative.",
  },
  {
    title: "Physics-aware scientific machine learning",
    body:
      "Studying how structure, conservation laws, and learned diversity improve forecasting and interpretation in nonlinear systems.",
  },
];

/** Publication theme shelves — aligned with research page themes. */
export const publicationShelves = [
  { id: "behavior", label: "Behavior & genomics", accent: "sage" },
  { id: "physics-ml", label: "Physics-informed ML", accent: "blue" },
  { id: "networks", label: "Networks & dynamics", accent: "oxide" },
];

export const publications = [
  {
    title:
      "JAX Animal Behavior System (JABS): A genetics-informed, end-to-end advanced behavioral phenotyping platform for the laboratory mouse",
    venue: "eLife",
    year: 2025,
    href: "https://elifesciences.org/articles/107259",
    summary:
      "Open platform for mouse behavior acquisition, annotation, classifier sharing, and downstream genetic analysis.",
    theme: "behavior",
    featured: true,
  },
  {
    title: "MorPhiC Consortium: towards functional characterization of all human genes",
    venue: "Nature",
    year: 2025,
    href: "https://www.nature.com/articles/s41586-024-08243-w",
    summary:
      "Consortium perspective on cataloging molecular phenotypes of null alleles across human protein-coding genes.",
    theme: "behavior",
    featured: true,
  },
  {
    title: "Neuronal diversity can improve machine learning for physics and beyond",
    venue: "Scientific Reports",
    year: 2023,
    href: "https://www.nature.com/articles/s41598-023-40766-6",
    summary:
      "Learned neuronal diversity improves nonlinear regression and physics-informed prediction.",
    theme: "physics-ml",
    featured: true,
  },
  {
    title: "Weak-winner phase synchronization: A curious case of weak interactions",
    venue: "Physical Review Research",
    year: 2021,
    href: "https://journals.aps.org/prresearch/abstract/10.1103/PhysRevResearch.3.023144",
    theme: "networks",
  },
  {
    title: "Forecasting Hamiltonian dynamics without canonical coordinates",
    venue: "Nonlinear Dynamics",
    year: 2021,
    href: "https://doi.org/10.1007/s11071-020-06057-7",
    theme: "physics-ml",
  },
  {
    title: "Negotiating the separatrix with machine learning",
    venue: "Nonlinear Theory and Its Applications, IEICE",
    year: 2021,
    href: "https://doi.org/10.1587/nolta.12.134",
    theme: "physics-ml",
  },
  {
    title: "Physics-enhanced neural networks learn order and chaos",
    venue: "Physical Review E",
    year: 2020,
    href: "https://journals.aps.org/pre/abstract/10.1103/PhysRevE.101.062207",
    summary:
      "Hamiltonian structure helps neural networks learn phase-space orbits through order–chaos transitions.",
    theme: "physics-ml",
  },
  {
    title: "The scaling of physics-informed machine learning with data and dimensions",
    venue: "Chaos, Solitons & Fractals: X",
    year: 2020,
    href: "https://doi.org/10.1016/j.csfx.2020.100046",
    theme: "physics-ml",
  },
  {
    title: "Suppression and revival of oscillations through time-varying interaction",
    venue: "Chaos, Solitons & Fractals",
    year: 2019,
    href: "https://doi.org/10.1016/j.chaos.2018.12.014",
    theme: "networks",
  },
  {
    title: "Multiple-node basin stability in complex dynamical networks",
    venue: "Physical Review E",
    year: 2017,
    href: "https://journals.aps.org/pre/abstract/10.1103/PhysRevE.95.032317",
    summary:
      "Stability framework for how simultaneous perturbations affect resilience in multistable networks.",
    theme: "networks",
  },
  {
    title: "Recovery time after localized perturbations in complex dynamical networks",
    venue: "New Journal of Physics",
    year: 2017,
    href: "https://doi.org/10.1088/1367-2630/aa8312",
    theme: "networks",
  },
  {
    title: "Small-world networks exhibit pronounced intermittent synchronization",
    venue: "Chaos",
    year: 2017,
    href: "https://doi.org/10.1063/1.4994611",
    theme: "networks",
  },
  {
    title: "Are network properties consistent indicators of synchronization?",
    venue: "Europhysics Letters",
    year: 2017,
    href: "https://doi.org/10.1209/0295-5075/117/20003",
    theme: "networks",
  },
  {
    title: "Synchronization in time-varying networks",
    venue: "Physical Review E",
    year: 2014,
    href: "https://journals.aps.org/pre/abstract/10.1103/PhysRevE.90.022812",
    theme: "networks",
  },
  {
    title: "Taming explosive growth through dynamic random links",
    venue: "Scientific Reports",
    year: 2014,
    href: "https://www.nature.com/articles/srep04308",
    theme: "networks",
  },
];

/** @deprecated Use `publications` — kept for any external imports. */
export const selectedPublications = publications.filter((p) => p.summary);
