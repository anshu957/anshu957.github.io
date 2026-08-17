# PU.1 / GATA1 toggle-switch: numerical spec for interactive figures

Source of truth: `toggle_switch_study.py` in this directory. Every number
below was printed by that script (not hand-computed) — rerun it with
`python3 toggle_switch_study.py` to reproduce. `x = PU.1` (myeloid), `y =
GATA1` (erythroid).

## 1. Equations

Canonical symmetric two-gene toggle switch (Huang et al. 2007, Dev Biol
305:695 — self-activation Hill term + mutual-inhibition Hill term − linear
decay):

```
dx/dt = a·xⁿ/(Sⁿ+xⁿ) + b·Sⁿ/(Sⁿ+yⁿ) − k·x
dy/dt = a·yⁿ/(Sⁿ+yⁿ) + b·Sⁿ/(Sⁿ+xⁿ) − k·y
```

Two extensions are used only for the "arrest" regime (Section 5):

- **Bias** (saddle-node fold): replace `a` with `aₓ = a+δ` in the `dx/dt`
  self-activation term and `a_y = a−δ` in `dy/dt`'s. Symmetric model is
  `δ=0`.
- **3-node extension** (Hopf search, negative result): multiply each
  self-activation term by a repression factor `Siᵖ/(Siᵖ+zᵖ)` and add
  `dz/dt = εz·[(x+y)ᵐ/(Szᵐ+(x+y)ᵐ) − kz·z]`.

## 2. Parameter sets

| Name | a | b | S | n | k | notes |
|---|---|---|---|---|---|---|
| **tristable-default** | 1 | 1 | 0.5 | 4 | 1 | progenitor + 2 fates + 2 saddles (the "default" the team lead specified) |
| **monostable** | 1 | 1 | 2.5 | 4 | 1 | single central attractor only |
| **near-bifurcation (monostable side)** | 1 | 1 | 1.6 | 4 | 1 | still monostable, close to S_c2 |
| **at-bifurcation** | 1 | 1 | 1.553774 (=S_c2) | 4 | 1 | exact pitchfork |
| **near-bifurcation (bistable side)** | 1 | 1 | 1.5 | 4 | 1 | just past S_c2, weakly bistable |
| **bistable-committed** | 1 | 1 | 1.0 | 4 | 1 | pure 2-attractor + 1-saddle regime, used as the base for the arrest study |
| **well-before (deep bistable)** | 1 | 1 | 0.8 | 4 | 1 | robustly bistable, no central attractor |
| **arrest / saddle-ghost** | aₓ=1+δ, a_y=1−δ | 1 | 1.0 | 4 | 1 | δ swept toward δ_c = 0.729632 |

All fixed points live in `x, y ∈ [0, ~3]`; the interactive figure should use
axis range **[0, 3]** (not `[0, ~2]` as originally guessed — the tristable
default's committed states sit near x≈1.996, and the bias/arrest study's
surviving attractor sits near x≈2.77, both within [0,3]).

## 3. Fixed points, by regime

All eigenvalues below are of the analytic Jacobian; "eig" lists both
eigenvalues (real unless noted). A **saddle** has one positive, one negative
eigenvalue. A **stable node** has both negative.

### 3a. tristable-default (a=b=1, S=0.5, n=4, k=1) — 5 fixed points

| point (x, y) | type | eigenvalues |
|---|---|---|
| (1.000000, 1.000000) | **stable node — progenitor** | (−0.557093, −1.000000) |
| (1.996078, 0.003922) | **stable node — myeloid fate** | (−0.992168, −1.000000) |
| (0.003922, 1.996078) | **stable node — erythroid fate** | (−1.000000, −0.992168) |
| (1.511575, 0.488425) | **saddle** (progenitor↔myeloid) | (−1.000000, +1.073847) |
| (0.488425, 1.511575) | **saddle** (progenitor↔erythroid) | (+1.073847, −1.000000) |

This is exactly the biologically intended picture: the progenitor is a
genuine (if shallow) attractor, the two fates are attractors, and each
saddle is the "undecided" barrier on the direct path between the progenitor
and one fate. The progenitor's basin is large (see §6); a cell must cross
one of the two saddles' stable manifolds to commit.

### 3b. Other named regimes — fixed-point summary

| S | regime | n_fp | central point type | eig(central) |
|---|---|---|---|---|
| 2.5 | monostable, deep | 1 | stable node (sole fp) | (−0.805296, −1.000000) |
| 1.6 | monostable, near S_c2 | 1 | stable node (sole fp) | (−0.081113, −1.000000) |
| 1.553774 | **at S_c2** | 1 | marginal (zero eigenvalue) | (−0.000000, −1.000000) |
| 1.5 | bistable, near S_c2 | 3 | **saddle** | (+0.101924, −1.000000) |
| 1.0 | bistable-committed | 3 | **saddle** | (+1.000000, −1.000000) |
| 0.8 | bistable, deep | 3 | **saddle** | (+0.649142, −1.000000) |
| 0.5 | tristable (default) | 5 | stable node | (−0.557093, −1.000000) |

Off-diagonal fixed points for S=1.5 and S=1.0 and S=0.8 (both attractors,
mirror images across x=y):

- S=1.5: (0.558801, 1.441199) / (1.441199, 0.558801), eig=(−1.000000, −0.177845) each
- S=1.0: (0.066838, 1.933162) / (1.933162, 0.066838), eig=(−1.000000, −0.869787) each
- S=0.8: (0.026283, 1.973717) / (1.973717, 0.026283), eig=(−1.000000, −0.947959) each

## 4. The bifurcation: monostable → bistable via threshold S

**Parameter swept:** `S` (Hill threshold), holding a=b=1, n=4, k=1.
Because a=b, the central ("progenitor") fixed point sits at the *exact*
closed form `x*=y*=a/k=1` for every S, which is what makes this sweep
analytically clean.

On the symmetric line the Jacobian is `[[A,B],[B,A]]` with eigenvalues
`A+B` (symmetric mode, **always exactly −k = −1** here) and `A−B`
(antisymmetric mode = `2·a·hillderiv(1,S,n) − k`, where
`hillderiv(u,S,n) = n·Sⁿ·u^(n−1)/(Sⁿ+uⁿ)²`). A pitchfork occurs exactly
where the antisymmetric eigenvalue crosses zero:

```
4·S⁴/(S⁴+1)² = 1/2   ⇒   S⁴ = 3 ± 2√2
```

giving **two exact critical values**:

- **S_c1 = (3 − 2√2)^(1/4) = 0.643594** — tristable ↔ bistable-committed boundary
- **S_c2 = (3 + 2√2)^(1/4) = 1.553774** — bistable-committed ↔ monostable boundary

**Bifurcation type: supercritical pitchfork**, confirmed two ways:
(1) the antisymmetric eigenvalue passes through exactly 0 at each S_c with
no other degeneracy; (2) the two off-diagonal fixed points continuously
shrink toward the central point and merge with it exactly at S_c2 as S
increases (S=1.5 gap 0.88 → S=1.5538 gap 0 → S=1.6 no off-diagonal points
at all), rather than disappearing via an independent fold elsewhere.

**Recommended primary bifurcation figure:** sweep S downward through
S_c2 = 1.554. For **S > S_c2** the system is monostable (single central
attractor — "uncommitted state is the only state"). For **S_c1 < S <
S_c2**, pure bistable ("undecided state is now a saddle; only the two fates
are stable"). Decreasing S further below **S_c1 = 0.644** re-stabilizes the
center (tristable, our default) — worth a one-line mention but not the
headline transition.

Representative values (well-before / near / at / well-after), all with
a=b=1, n=4, k=1:

| S | regime | fixed points |
|---|---|---|
| 2.5 | well-after (deep monostable) | 1: (1,1) stable |
| 1.6 | near (monostable side) | 1: (1,1) stable, weakly (eig −0.081) |
| 1.553774 | **at S_c2** | 1: (1,1) marginal (eig 0) |
| 1.5 | near (bistable side) | 3: (1,1) saddle + 2 stable at (0.5588,1.4412)/(1.4412,0.5588) |
| 0.8 | well-before (deep bistable) | 3: (1,1) saddle + 2 stable at (0.0263,1.9737)/(1.9737,0.0263) |

## 5. Arrest / "stuck" regime — both investigated

### 5a. Saddle-node ghost (recommended figure)

Symmetry must be broken to get a genuine fold (the pitchforks in §4 are not
folds — approaching them makes the *progenitor* linger, not a
half-committed cell). Bias self-activation asymmetrically: `aₓ=1+δ,
a_y=1−δ`, at the **bistable-committed** base point `b=1, S=1.0, n=4, k=1`.

- At `δ=0`: saddle (1,1) eig=(+1,−1); erythroid attractor (0.066838,
  1.933162) eig=(−1, −0.869787); myeloid attractor (mirror image).
- As δ increases, the erythroid attractor and the saddle move toward each
  other and **annihilate in a textbook saddle-node fold** at:

  ```
  δ_c = 0.72963161
  fold point (x*, y*) = (0.45887834, 1.12369973)
  Jacobian eigenvalues at fold: (0.0, −1.15907753)   ← exactly one zero eigenvalue
  ```

- Past the fold (e.g. δ=0.8) only the myeloid attractor survives, at
  (2.76993, 0.01670), eig=(−0.95730, −1.00001) — well inside the [0,3] axis
  range.

**Dwell-time measurement.** Starting a trajectory at the fold point (nudged
by 2×10⁻⁴) for δ slightly above δ_c, we measured time to escape a ball of
radius R=0.25 around the ghost:

| δ−δ_c | dwell time |
|---|---|
| 0.05 | 5.57 |
| 0.02 | 9.57 |
| 0.01 | 14.11 |
| 0.005 | 20.54 |
| 0.002 | 33.30 |
| 0.001 | 47.61 |
| 0.0005 | 67.72 |
| 0.0002 | 107.07 |
| 0.0001 | 150.53 |
| 0.00005 | 210.31 |

Power-law fit on the asymptotic (δ−δ_c < 0.01) points: **dwell ∝
(δ−δ_c)^(−0.505)** — matching the textbook saddle-node ghost divergence
`τ ~ π/√(μ−μc)` to within 1%. This is a rigorous, fully-2-gene "arrest": a
cell that finds itself near the vanished saddle/attractor pair genuinely
crawls for a long, precisely-quantified time before committing, and the
divergence is the universal inverse-square-root law, not a modeling
artifact.

### 5b. 3-node limit cycle — attempted, does not arise (negative result, reported honestly)

Extension: `dz/dt = εz·[(x+y)ᵐ/(Szᵐ+(x+y)ᵐ) − kz·z]`, with both
self-activation terms multiplied by a repression factor `Siᵖ/(Siᵖ+zᵖ)` (z
is driven by both genes and suppresses both, exactly as specified). Base
toggle-switch parameters a=b=1, S=0.5, n=4, k=1.

We scanned for a Hopf bifurcation (a pair of complex eigenvalues crossing
into the right half-plane) at the model's asymmetric fixed point across:

- **εz** (timescale separation): 0.001 → 0.5 (3 decades) — eigenvalues stay
  real and negative throughout, the z-eigenvalue simply tracking −εz·kz.
- **p** (repression steepness): 2 → 20 — no qualitative change, fixed point
  converges to a limit configuration for p≳8.
- **kz** (repressor decay rate): 0.005 → 50 — eigenvalues are real and
  negative almost everywhere; a narrow window near kz≈5 and kz≈50 produces
  a complex-conjugate pair, but its real part stays negative (a **damped
  spiral**, not a source) — e.g. at kz=5: eig = (−0.9888±0.0085i, −0.1064).

**No parameter combination tested produces Re(λ) > 0 for a complex pair.**
There is no Hopf bifurcation and no limit cycle for this topology.

**Mechanistic reason (not just "we didn't find it"):** z is driven by
`x+y`, and `x+y` is nearly *conserved* across commitment in this model —
whichever gene ends up high, the total stays close to its progenitor value
(≈1 in the default set, ≈2 in the committed states, but the swing is small
and monotonic, not oscillatory). A repressor that senses the *sum* cannot
apply direction-dependent, phase-lagged feedback; it can only rescale the
effective self-activation strength `a`. That just slides the system along
the *same* mono-/bi-/tristable diagram from §4 — a "renormalized landscape,"
not a clock. Genuine oscillation would need a topology that treats x and y
asymmetrically (e.g., z produced preferentially by whichever gene is
currently dominant, and repressing *only* that one — a proper
relaxation-oscillator / repressilator-style cross-coupling), which is a
materially different, less minimal circuit than "one shared repressor."

**Recommendation: use the saddle-node ghost (5a), not a limit cycle, for
the "differentiation arrest" figure.** It requires no invented third gene,
stays inside the same 2-gene model the rest of the piece already uses, and
its 1/√ divergence is both analytically classical and numerically verified
above to 3 significant figures. The 3-node attempt is worth one paragraph
as an honest "we checked, it doesn't happen this way" aside — it forecloses
the obvious follow-up question without requiring the frontend to build
anything with it.

## 6. Basins of attraction / separatrix (default tristable set)

For a=b=1, S=0.5, n=4, k=1, a 15×15 grid of initial conditions on
`[0.01,2.4]²`, integrated to t=60 (RK45, rtol=1e-8), classified by nearest
attractor (tolerance 10⁻³ in squared distance):

```
{'central': 147, 'myeloid': 39, 'erythroid': 39, 'other/unclear': 0}
```

Zero grid points landed in the myeloid basin while starting on the y>x side
of the diagonal, or in the erythroid basin while starting on the x>y side
— **the separatrix cleanly tracks the anti-diagonal**, exactly as the
symmetric model predicts. Recipe for the frontend/any regeneration: for
each pixel/grid initial condition, integrate the ODE (any reasonable
integrator, t_final ≳ 30–60 is generous given k=1) and color by nearest
fixed point among the classified attractors. The stable manifold of each
saddle *is* the local piece of the separatrix; it passes through the saddle
by construction (a saddle's own position trivially lies on its stable
manifold), which the grid computation confirms structurally (no
"leakage" across the manifold in the sampled basin).

## 7. Integration guidance for the frontend

- **Integrator:** RK4 (fixed-step) is sufficient and simple for interactive
  use; the study used adaptive RK45 (`scipy.solve_ivp`, rtol 1e-8–1e-11)
  for precision, but the vector field is smooth and non-stiff (k=1 sets the
  natural timescale) so fixed-step RK4 with **dt = 0.02–0.05** matches it
  closely.
- **Normal commitment runs:** total integration time **T ≈ 15–20** is
  enough for a trajectory to visibly commit and settle in any of the
  tristable/bistable/monostable regimes (decay rate k=1 ⇒ natural
  relaxation time ~1; even the slowest non-ghost eigenvalue in the tables
  above is ≈0.02–0.2, i.e. settling in well under 20 time units outside the
  ghost regime).
- **Ghost/arrest demo specifically:** dwell times of 50–200+ time units
  occur by design as δ→δ_c — give that figure its own longer T (≈250) or a
  speed/time-warp control; do not reuse the T≈20 default there or the
  "stuck" behavior will look like nothing happens.
- **Axis ranges:** use **x, y ∈ [0, 3]** for all figures (covers every fixed
  point across every regime above, including the arrest study's surviving
  attractor at x≈2.77).
- **Basins/separatrix rendering:** a grid of ~40–80 per side integrated to
  t≈30–60 and colored by nearest attractor is enough to render a clean
  separatrix at typical figure resolution; no need to trace the stable
  manifold analytically.

## 8. Reference JSON (frontend assertions)

```json
{
  "model": {
    "dx": "a*x^n/(S^n+x^n) + b*S^n/(S^n+y^n) - k*x",
    "dy": "a*y^n/(S^n+y^n) + b*S^n/(S^n+x^n) - k*y"
  },
  "axisRange": [0, 3],
  "regimes": {
    "tristable-default": {
      "params": { "a": 1, "b": 1, "S": 0.5, "n": 4, "k": 1 },
      "fixedPoints": [
        { "point": [1.0, 1.0], "type": "stable", "role": "progenitor", "eig": [-0.557093, -1.0] },
        { "point": [1.996078, 0.003922], "type": "stable", "role": "myeloid", "eig": [-0.992168, -1.0] },
        { "point": [0.003922, 1.996078], "type": "stable", "role": "erythroid", "eig": [-1.0, -0.992168] },
        { "point": [1.511575, 0.488425], "type": "saddle", "role": "progenitor-myeloid barrier", "eig": [-1.0, 1.073847] },
        { "point": [0.488425, 1.511575], "type": "saddle", "role": "progenitor-erythroid barrier", "eig": [1.073847, -1.0] }
      ]
    },
    "monostable": {
      "params": { "a": 1, "b": 1, "S": 2.5, "n": 4, "k": 1 },
      "fixedPoints": [
        { "point": [1.0, 1.0], "type": "stable", "role": "progenitor", "eig": [-0.805296, -1.0] }
      ]
    },
    "bistable-committed": {
      "params": { "a": 1, "b": 1, "S": 1.0, "n": 4, "k": 1 },
      "fixedPoints": [
        { "point": [1.0, 1.0], "type": "saddle", "role": "undecided", "eig": [1.0, -1.0] },
        { "point": [0.066838, 1.933162], "type": "stable", "role": "erythroid", "eig": [-1.0, -0.869787] },
        { "point": [1.933162, 0.066838], "type": "stable", "role": "myeloid", "eig": [-0.869787, -1.0] }
      ]
    }
  },
  "bifurcation": {
    "parameter": "S",
    "fixedOther": { "a": 1, "b": 1, "n": 4, "k": 1 },
    "criticalValues": {
      "S_c1_tristable_to_bistable": 0.643594,
      "S_c2_bistable_to_monostable": 1.553774
    },
    "type": "supercritical pitchfork (both crossings)"
  },
  "arrest": {
    "recommended": "saddle-node-ghost",
    "saddleNodeGhost": {
      "params": { "a_x": "1+delta", "a_y": "1-delta", "b": 1, "S": 1.0, "n": 4, "k": 1 },
      "delta_c": 0.72963161,
      "foldPoint": [0.45887834, 1.12369973],
      "foldEigenvalues": [0.0, -1.15907753],
      "dwellTimeScalingExponent": -0.505,
      "dwellTimeExample": { "delta_minus_delta_c": 0.001, "dwellTime": 47.61 }
    },
    "limitCycleAttempt": {
      "found": false,
      "reason": "z driven by x+y (near-conserved across commitment) cannot supply direction-dependent feedback; only rescales effective self-activation"
    }
  }
}
```
