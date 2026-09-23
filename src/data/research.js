/**
 * Research areas (the /research page, in order) and publications.
 * Each publication's `area` is one of the area ids; authors are full names as published (Crossref).
 */
export const researchAreas = [
  {
    id: "cell-fate",
    label: "Cell fate",
    title: "Cell fate & transcriptomic dynamics",
    body: "How does a cell commit to what it becomes? I think about this with the tools of dynamical systems (attractors, basins, vector fields) applied to RNA expression. A cluster label tells you where a cell sits. I want a picture that also says which way it is being pushed, and which fates are still open to it (and how hard it would be to get there).",
    accent: "oxide",
    plate: "landscape",
    posts: ["watching-cells-decide"],
  },
  {
    id: "behavior",
    label: "Behavior & genetics",
    title: "Behavioral phenotyping & machine learning",
    body: "At JAX I led JABS (the JAX Animal Behavior System, with Vivek Kumar's lab). It is an open platform that takes you from video of a mouse to its pose, then to behavior classifiers, and finally to genetics. A lot of the work is in the plumbing between those steps, and the part I care about most is making it something other labs actually pick up and use.",
    links: [{ label: "JABS on GitHub", href: "https://github.com/KumarLabJax/JABS-behavior-classifier" }],
    accent: "sage",
    plate: "pose",
    posts: [],
  },
  {
    id: "physics-ml",
    label: "Physics-informed ML",
    title: "Physics-aware scientific machine learning",
    body: "At NC State (with William Ditto, John Lindner and Sudeshna Sinha) I asked a simple question: if a neural network knows the structure of the physics (energy conservation, the geometry of phase space), does it forecast better? For Hamiltonian systems it mostly did, and the gain was largest where ordinary networks get lost (through the order-to-chaos transition and across separatrices). We also looked at how this scales with data and dimension, and found that letting neurons differ from each other helps learning too.",
    accent: "blue",
    plate: "torus",
    posts: [],
  },
  {
    id: "networks",
    label: "Dynamics on networks",
    title: "Dynamics on complex networks",
    body: "My PhD (at IISER Mohali) and first postdoc (at Oldenburg) were about dynamics on networks, mostly coupled oscillators. The wiring (fixed, rewired over time, or small-world) decides whether they fall into step. I spent a lot of time on how far a synchronized network can be pushed before it stops coming back (basin stability for many nodes at once, and recovery times after local shocks). At Oldenburg I moved to synchronization in ecological food webs, and to a curious case where weakly coupled units lock in phase while the strongly coupled ones keep drifting.",
    accent: "gold",
    plate: "ring",
    posts: [],
  },
];

export function areaById(id) {
  return researchAreas.find((area) => area.id === id);
}

/** "Anshul Choudhary" -> "A. Choudhary"; consortium names pass through. */
export function shortAuthor(name) {
  const parts = name.split(" ");
  if (parts.length < 2 || /consortium/i.test(name)) return name;
  const family = parts.pop();
  return `${parts.map((p) => p.split("-").map((q) => `${q[0]}.`).join("-")).join(" ")} ${family}`;
}

export const publications = [
  {
    "title": "JAX Animal Behavior System (JABS): A genetics-informed, end-to-end advanced behavioral phenotyping platform for the laboratory mouse",
    "authors": [
      "Anshul Choudhary",
      "Brian Q. Geuther",
      "Thomas J. Sproule",
      "Glen Beane",
      "Vivek Kohar",
      "Jarek Trapszo",
      "Vivek Kumar"
    ],
    "venue": "eLife",
    "year": 2025,
    "doi": "10.7554/eLife.107259",
    "summary": "Open platform for mouse behavior acquisition, annotation, classifier sharing, and downstream genetic analysis.",
    "area": "behavior",
    "links": [
      {
        "label": "Code",
        "href": "https://github.com/KumarLabJax/JABS-behavior-classifier"
      }
    ]
  },
  {
    "title": "MorPhiC Consortium: towards functional characterization of all human genes",
    "authors": [
      "MorPhiC Consortium"
    ],
    "venue": "Nature",
    "year": 2025,
    "doi": "10.1038/s41586-024-08243-w",
    "summary": "Consortium perspective on cataloging molecular phenotypes of null alleles across human protein-coding genes.",
    "area": "cell-fate",
    "note": "A. Choudhary is a consortium member",
        "links": []
  },
  {
    "title": "Neuronal diversity can improve machine learning for physics and beyond",
    "authors": [
      "Anshul Choudhary",
      "Anil Radhakrishnan",
      "John F. Lindner",
      "Sudeshna Sinha",
      "William L. Ditto"
    ],
    "venue": "Scientific Reports",
    "year": 2023,
    "doi": "10.1038/s41598-023-40766-6",
    "summary": "Learned neuronal diversity improves nonlinear regression and physics-informed prediction.",
    "area": "physics-ml",
    "links": [
      {
        "label": "Code",
        "href": "https://github.com/NonlinearArtificialIntelligenceLab/DiversityNN"
      }
    ]
  },
  {
    "title": "Weak-winner phase synchronization: A curious case of weak interactions",
    "authors": [
      "Anshul Choudhary",
      "Arindam Saha",
      "Samuel Krueger",
      "Christian Finke",
      "Epaminondas Rosa",
      "Jan A. Freund",
      "Ulrike Feudel"
    ],
    "venue": "Physical Review Research",
    "year": 2021,
    "doi": "10.1103/physrevresearch.3.023144",
    "summary": "Weakly coupled oscillators can synchronize while strongly coupled neighbors remain drifting.",
    "area": "networks",
    "links": [
      {
        "label": "Code",
        "href": "https://github.com/anshu957/WeakWinner"
      }
    ]
  },
  {
    "title": "Forecasting Hamiltonian dynamics without canonical coordinates",
    "authors": [
      "Anshul Choudhary",
      "John F. Lindner",
      "Elliott G. Holliday",
      "Scott T. Miller",
      "Sudeshna Sinha",
      "William L. Ditto"
    ],
    "venue": "Nonlinear Dynamics",
    "year": 2021,
    "doi": "10.1007/s11071-020-06185-2",
    "summary": "Generalized Hamiltonian neural networks forecast dynamics beyond canonical phase-space coordinates.",
    "area": "physics-ml",
    "links": [
      {
        "label": "Code",
        "href": "https://github.com/anshu957/gHNN"
      }
    ]
  },
  {
    "title": "Negotiating the separatrix with machine learning",
    "authors": [
      "Scott T. Miller",
      "John F. Lindner",
      "Anshul Choudhary",
      "Sudeshna Sinha",
      "William L. Ditto"
    ],
    "venue": "Nonlinear Theory and Its Applications, IEICE",
    "year": 2021,
    "doi": "10.1587/nolta.12.134",
    "summary": "Hamiltonian neural networks cross separatrices that trap conventional forecasters.",
    "area": "physics-ml",
    "links": []
  },
  {
    "title": "Physics-enhanced neural networks learn order and chaos",
    "authors": [
      "Anshul Choudhary",
      "John F. Lindner",
      "Elliott G. Holliday",
      "Scott T. Miller",
      "Sudeshna Sinha",
      "William L. Ditto"
    ],
    "venue": "Physical Review E",
    "year": 2020,
    "doi": "10.1103/physreve.101.062207",
    "summary": "Hamiltonian structure helps neural networks learn phase-space orbits through order–chaos transitions.",
    "area": "physics-ml",
    "links": [
      {
        "label": "Code",
        "href": "https://github.com/anshu957/OrderChaosHNN"
      }
    ]
  },
  {
    "title": "The scaling of physics-informed machine learning with data and dimensions",
    "authors": [
      "Scott T. Miller",
      "John F. Lindner",
      "Anshul Choudhary",
      "Sudeshna Sinha",
      "William L. Ditto"
    ],
    "venue": "Chaos, Solitons & Fractals: X",
    "year": 2020,
    "doi": "10.1016/j.csfx.2020.100046",
    "summary": "How data volume and phase-space dimension affect physics-informed learning performance.",
    "area": "physics-ml",
    "links": []
  },
  {
    "title": "Suppression and revival of oscillations through time-varying interaction",
    "authors": [
      "Sudhanshu Shekhar Chaurasia",
      "Anshul Choudhary",
      "Manish Dev Shrimali",
      "Sudeshna Sinha"
    ],
    "venue": "Chaos, Solitons & Fractals",
    "year": 2019,
    "doi": "10.1016/j.chaos.2018.11.026",
    "summary": "Periodically switched coupling suppresses and revives collective oscillations.",
    "area": "networks",
    "links": []
  },
  {
    "title": "Multiple-node basin stability in complex dynamical networks",
    "authors": [
      "Chiranjit Mitra",
      "Anshul Choudhary",
      "Sudeshna Sinha",
      "Jürgen Kurths",
      "Reik V. Donner"
    ],
    "venue": "Physical Review E",
    "year": 2017,
    "doi": "10.1103/physreve.95.032317",
    "summary": "Framework for stability under simultaneous perturbations across multiple network nodes.",
    "area": "networks",
    "links": []
  },
  {
    "title": "Recovery time after localized perturbations in complex dynamical networks",
    "authors": [
      "Chiranjit Mitra",
      "Tim Kittel",
      "Anshul Choudhary",
      "Jürgen Kurths",
      "Reik V. Donner"
    ],
    "venue": "New Journal of Physics",
    "year": 2017,
    "doi": "10.1088/1367-2630/aa7fab",
    "summary": "Node recovery times scale with degree in heterogeneous oscillator networks.",
    "area": "networks",
    "links": []
  },
  {
    "title": "Small-world networks exhibit pronounced intermittent synchronization",
    "authors": [
      "Anshul Choudhary",
      "Chiranjit Mitra",
      "Vivek Kohar",
      "Sudeshna Sinha",
      "Jürgen Kurths"
    ],
    "venue": "Chaos",
    "year": 2017,
    "doi": "10.1063/1.5002883",
    "summary": "Intermittent sync in Watts–Strogatz Rössler networks beyond master-stability predictions.",
    "area": "networks",
    "links": []
  },
  {
    "title": "Are network properties consistent indicators of synchronization?",
    "authors": [
      "Pranay Deep Rungta",
      "Anshul Choudhary",
      "Chandrakala Meena",
      "Sudeshna Sinha"
    ],
    "venue": "Europhysics Letters",
    "year": 2017,
    "doi": "10.1209/0295-5075/117/20003",
    "summary": "Degree, clustering, and path length do not predict sync consistently across network classes.",
    "area": "networks",
    "links": []
  },
  {
    "title": "Synchronization in time-varying networks",
    "authors": [
      "Vivek Kohar",
      "Peng Ji",
      "Anshul Choudhary",
      "Sudeshna Sinha",
      "Jürgen Kurths"
    ],
    "venue": "Physical Review E",
    "year": 2014,
    "doi": "10.1103/PhysRevE.90.022812",
    "summary": "Rewiring frequency and coupling strength shape synchrony in adaptive networks.",
    "area": "networks",
    "links": []
  },
  {
    "title": "Taming explosive growth through dynamic random links",
    "authors": [
      "Anshul Choudhary",
      "Vivek Kohar",
      "Sudeshna Sinha"
    ],
    "venue": "Scientific Reports",
    "year": 2014,
    "doi": "10.1038/srep04308",
    "summary": "Dynamic random rewiring suppresses finite-time blow-up in coupled oscillator systems.",
    "area": "networks",
    "links": []
  }
];
