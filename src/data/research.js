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

const shelfLabelByTheme = Object.fromEntries(
  publicationShelves.map((shelf) => [shelf.id, shelf.label]),
);

export function publicationThemeLabel(theme) {
  return shelfLabelByTheme[theme] ?? "Research";
}

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
    image: "/assets/research/jabs.jpg",
    imageAlt: "JABS pipeline: acquisition, annotation, and genetics modules.",
  },
  {
    title: "MorPhiC Consortium: towards functional characterization of all human genes",
    venue: "Nature",
    year: 2025,
    href: "https://www.nature.com/articles/s41586-024-08243-w",
    summary:
      "Consortium perspective on cataloging molecular phenotypes of null alleles across human protein-coding genes.",
    theme: "behavior",
    image: "/assets/research/morphic.jpg",
    imageAlt: "Publication counts per gene, illustrating bias toward well-studied genes.",
  },
  {
    title: "Neuronal diversity can improve machine learning for physics and beyond",
    venue: "Scientific Reports",
    year: 2023,
    href: "https://www.nature.com/articles/s41598-023-40766-6",
    summary:
      "Learned neuronal diversity improves nonlinear regression and physics-informed prediction.",
    theme: "physics-ml",
    image: "/assets/research/neuronal-diversity.png",
    imageAlt: "Schematic of homogeneous, diverse, and learned-diverse neural networks.",
  },
  {
    title: "Weak-winner phase synchronization: A curious case of weak interactions",
    venue: "Physical Review Research",
    year: 2021,
    href: "https://journals.aps.org/prresearch/abstract/10.1103/PhysRevResearch.3.023144",
    summary:
      "Weakly coupled oscillators can synchronize while strongly coupled neighbors remain drifting.",
    theme: "networks",
    image: "/assets/research/weak-winner.png",
    imageAlt: "Routes to weak-winner synchronization in oscillator chains and networks.",
  },
  {
    title: "Forecasting Hamiltonian dynamics without canonical coordinates",
    venue: "Nonlinear Dynamics",
    year: 2021,
    href: "https://doi.org/10.1007/s11071-020-06057-7",
    summary:
      "Generalized Hamiltonian neural networks forecast dynamics beyond canonical phase-space coordinates.",
    theme: "physics-ml",
    image: "/assets/research/hamiltonian-forecast.png",
    imageAlt: "NN, HNN, and generalized HNN architectures for Hamiltonian forecasting.",
  },
  {
    title: "Negotiating the separatrix with machine learning",
    venue: "Nonlinear Theory and Its Applications, IEICE",
    year: 2021,
    href: "https://doi.org/10.1587/nolta.12.134",
    summary:
      "Hamiltonian neural networks cross separatrices that trap conventional forecasters.",
    theme: "physics-ml",
    image: "/assets/research/separatrix-ml.png",
    imageAlt: "Elastic pendulum phase-space forecasts comparing NN and Hamiltonian models.",
  },
  {
    title: "Physics-enhanced neural networks learn order and chaos",
    venue: "Physical Review E",
    year: 2020,
    href: "https://journals.aps.org/pre/abstract/10.1103/PhysRevE.101.062207",
    summary:
      "Hamiltonian structure helps neural networks learn phase-space orbits through order–chaos transitions.",
    theme: "physics-ml",
    image: "/assets/research/physics-enhanced-nn.jpg",
    imageAlt: "Hénon–Heiles phase-space orbits learned by physics-enhanced neural networks.",
  },
  {
    title: "The scaling of physics-informed machine learning with data and dimensions",
    venue: "Chaos, Solitons & Fractals: X",
    year: 2020,
    href: "https://doi.org/10.1016/j.csfx.2020.100046",
    summary:
      "How data volume and phase-space dimension affect physics-informed learning performance.",
    theme: "physics-ml",
    image: "/assets/research/scaling-piml.png",
    imageAlt: "Scaling of conventional and Hamiltonian neural network training costs.",
  },
  {
    title: "Suppression and revival of oscillations through time-varying interaction",
    venue: "Chaos, Solitons & Fractals",
    year: 2019,
    href: "https://doi.org/10.1016/j.chaos.2018.12.014",
    summary:
      "Periodically switched coupling suppresses and revives collective oscillations.",
    theme: "networks",
    image: "/assets/research/suppression-revival.png",
    imageAlt: "Bifurcation diagram under time-varying similar and dissimilar coupling.",
  },
  {
    title: "Multiple-node basin stability in complex dynamical networks",
    venue: "Physical Review E",
    year: 2017,
    href: "https://journals.aps.org/pre/abstract/10.1103/PhysRevE.95.032317",
    summary:
      "Framework for stability under simultaneous perturbations across multiple network nodes.",
    theme: "networks",
    image: "/assets/research/basin-stability.png",
    imageAlt: "Schematic of single-node basin stability in a coupled oscillator network.",
  },
  {
    title: "Recovery time after localized perturbations in complex dynamical networks",
    venue: "New Journal of Physics",
    year: 2017,
    href: "https://doi.org/10.1088/1367-2630/aa7fab",
    summary:
      "Node recovery times scale with degree in heterogeneous oscillator networks.",
    theme: "networks",
    image: "/assets/research/recovery-time.png",
    imageAlt: "Scale-free Rössler network with node size proportional to recovery time.",
  },
  {
    title: "Small-world networks exhibit pronounced intermittent synchronization",
    venue: "Chaos",
    year: 2017,
    href: "https://doi.org/10.1063/1.5002883",
    summary:
      "Intermittent sync in Watts–Strogatz Rössler networks beyond master-stability predictions.",
    theme: "networks",
    image: "/assets/research/small-world-sync.png",
    imageAlt: "Intermittent synchronization in small-world oscillator networks.",
  },
  {
    title: "Are network properties consistent indicators of synchronization?",
    venue: "Europhysics Letters",
    year: 2017,
    href: "https://doi.org/10.1209/0295-5075/117/20003",
    summary:
      "Degree, clustering, and path length do not predict sync consistently across network classes.",
    theme: "networks",
    image: "/assets/research/network-sync-indicators.png",
    imageAlt: "Network topologies and synchronization measures across network classes.",
  },
  {
    title: "Synchronization in time-varying networks",
    venue: "Physical Review E",
    year: 2014,
    href: "https://journals.aps.org/pre/abstract/10.1103/PhysRevE.90.022812",
    summary:
      "Rewiring frequency and coupling strength shape synchrony in adaptive networks.",
    theme: "networks",
    image: "/assets/research/time-varying-sync.png",
    imageAlt: "Heatmaps of synchrony fraction versus rewiring frequency and coupling.",
  },
  {
    title: "Taming explosive growth through dynamic random links",
    venue: "Scientific Reports",
    year: 2014,
    href: "https://www.nature.com/articles/srep04308",
    summary:
      "Dynamic random rewiring suppresses finite-time blow-up in coupled oscillator systems.",
    theme: "networks",
    image: "/assets/research/taming-explosive.jpg",
    imageAlt: "Space-time evolution and limit cycles under fast versus slow rewiring.",
  },
];

/** @deprecated Use `publications` — kept for any external imports. */
export const selectedPublications = publications.filter((p) => p.summary);
