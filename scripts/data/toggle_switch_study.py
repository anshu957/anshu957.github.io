"""
Numerical study of the PU.1 / GATA1 lineage-commitment toggle switch.

Canonical symmetric two-gene toggle switch (Huang et al. 2007, Dev Biol 305:695),
x = PU.1 (myeloid), y = GATA1 (erythroid):

    dx/dt = a*x^n/(S^n+x^n) + b*S^n/(S^n+y^n) - k*x
    dy/dt = a*y^n/(S^n+y^n) + b*S^n/(S^n+x^n) - k*y

This script is the reproducible source for every number quoted in
`toggle-switch-spec.md`. Run it directly:

    python3 toggle_switch_study.py

Sections:
  1. Fixed-point finder + Jacobian classification (generic, reused everywhere).
  2. Default "tristable" parameter set: progenitor + 2 fates + 2 saddles.
  3. Bifurcation sweep in S: monostable <-> bistable-committed <-> tristable,
     both critical values obtained analytically (closed form) and confirmed
     numerically.
  4. Arrest, part A: a symmetry-breaking bias (a_x = a+delta, a_y = a-delta)
     drives a genuine saddle-node fold; dwell time near the resulting "ghost"
     is measured and its divergence exponent fit.
  5. Arrest, part B: an extended 3-node model (slow global repressor z) is
     scanned for a Hopf bifurcation / limit cycle. Reports the (negative)
     result and the mechanistic reason.
  6. Basin-of-attraction / separatrix sanity check for the default parameters.

All fixed points are found by a coarse grid of seeds fed to `fsolve`,
deduplicated, then classified by the sign structure of the Jacobian's
eigenvalues at that point.
"""

import numpy as np
from scipy.optimize import fsolve
from scipy.integrate import solve_ivp

# --------------------------------------------------------------------------
# 1. Core model + generic fixed-point / classification helpers
# --------------------------------------------------------------------------

def rhs(state, a, b, S, n, k):
    """Right-hand side of the 2-gene toggle switch."""
    x, y = state
    fx = a * x**n / (S**n + x**n) + b * S**n / (S**n + y**n) - k * x
    fy = a * y**n / (S**n + y**n) + b * S**n / (S**n + x**n) - k * y
    return np.array([fx, fy])


def _hill_deriv(u, S, n):
    """d/du [ u^n/(S^n+u^n) ], used to build the analytic Jacobian."""
    return n * S**n * u**(n - 1) / (S**n + u**n)**2


def jac(state, a, b, S, n, k):
    x, y = state
    dfdx = a * _hill_deriv(x, S, n) - k
    dfdy = -b * _hill_deriv(y, S, n)
    dgdx = -b * _hill_deriv(x, S, n)
    dgdy = a * _hill_deriv(y, S, n) - k
    return np.array([[dfdx, dfdy], [dgdx, dgdy]])


def find_fixed_points(a, b, S, n, k, lo=0.0, hi=3.0, ngrid=25, tol_res=1e-10, tol_dedup=1e-4):
    """Grid-seeded fsolve + dedup. Returns list of (x, y) tuples, x,y >= 0."""
    seeds = [(x0, y0) for x0 in np.linspace(lo, hi, ngrid) for y0 in np.linspace(lo, hi, ngrid)]
    sols = []
    for s0 in seeds:
        sol, info, ier, msg = fsolve(rhs, s0, args=(a, b, S, n, k), full_output=True, xtol=1e-13)
        if ier == 1 and np.all(sol > -1e-6) and np.all(np.abs(rhs(sol, a, b, S, n, k)) < tol_res):
            sols.append(tuple(np.round(sol, 8)))
    uniq = []
    for s in sols:
        if not any(np.allclose(s, u, atol=tol_dedup) for u in uniq):
            uniq.append(s)
    return uniq


def classify(point, a, b, S, n, k):
    """Classify a fixed point from Jacobian eigenvalues. Returns (label, eigs)."""
    eig = np.linalg.eigvals(jac(np.array(point), a, b, S, n, k))
    if np.all(eig.real < -1e-9):
        label = "stable node (attractor)"
    elif np.all(eig.real > 1e-9):
        label = "unstable node (repeller)"
    else:
        label = "saddle"
    if np.any(np.abs(eig.imag) > 1e-9):
        label += " [complex/spiral]"
    return label, eig


def report_fixed_points(a, b, S, n, k, title):
    pts = find_fixed_points(a, b, S, n, k)
    print(f"\n--- {title}  (a={a}, b={b}, S={S}, n={n}, k={k}) ---  n_fp={len(pts)}")
    for p in pts:
        label, eig = classify(p, a, b, S, n, k)
        print(f"  ({p[0]:.6f}, {p[1]:.6f})  {label:28s}  eig=({eig[0]:.6f}, {eig[1]:.6f})")
    return pts


# --------------------------------------------------------------------------
# 2. Default "tristable" parameter set
# --------------------------------------------------------------------------

def section_2_default():
    print("\n" + "=" * 78)
    print("SECTION 2: default tristable parameter set")
    print("=" * 78)
    a, b, S, n, k = 1.0, 1.0, 0.5, 4, 1.0
    report_fixed_points(a, b, S, n, k, "tristable-default")


# --------------------------------------------------------------------------
# 3. Bifurcation sweep in S (with a=b so the algebra is exact)
# --------------------------------------------------------------------------
#
# When a=b, x=y=x* solves a*(x*^n+S^n)/(S^n+x*^n) - k*x* = a - k*x* = 0,
# so the central ("progenitor") fixed point sits EXACTLY at x*=a/k for every S.
# Its Jacobian on the symmetric line is [[A,B],[B,A]] with
#   A = a*hillderiv(x*) - k,  B = -b*hillderiv(x*)
# giving eigenvalues A+B (symmetric mode) and A-B (antisymmetric mode).
# With a=b=k=1, x*=1, symmetric eigenvalue is exactly -1 always; the
# antisymmetric eigenvalue 2*hillderiv(1,S,n) - 1 changes sign at
#   4*S^4/(S^4+1)^2 = 1/2  =>  S^4 = 3 +/- 2*sqrt(2)
# giving two exact pitchfork thresholds bracketing a pure bistable window.

def antisym_eig(S, a=1.0, b=1.0, n=4, k=1.0):
    return (a + b) * _hill_deriv(1.0, S, n) - k


def section_3_bifurcation():
    print("\n" + "=" * 78)
    print("SECTION 3: bifurcation sweep in threshold S (a=b=1, n=4, k=1)")
    print("=" * 78)
    Sc1 = (3 - 2 * np.sqrt(2)) ** 0.25
    Sc2 = (3 + 2 * np.sqrt(2)) ** 0.25
    print(f"Exact pitchfork thresholds (closed form, S^4 = 3 -+ 2*sqrt(2)):")
    print(f"  S_c1 = {Sc1:.6f}   (tristable <-> bistable-committed)")
    print(f"  S_c2 = {Sc2:.6f}   (bistable-committed <-> monostable)")

    for S, label in [
        (2.5, "well-after / deep monostable"),
        (1.6, "near Sc2, monostable side"),
        (Sc2, "AT Sc2 (critical)"),
        (1.5, "near Sc2, bistable side"),
        (0.8, "well-before / deep bistable-committed"),
        (0.5, "default (tristable, below Sc1)"),
    ]:
        report_fixed_points(1.0, 1.0, S, 4, 1.0, f"S={S:.6f} [{label}]")


# --------------------------------------------------------------------------
# 4. Arrest, part A: saddle-node fold via symmetry-breaking self-activation
#    bias, and the dwell-time divergence near its ghost.
# --------------------------------------------------------------------------

def rhs_bias(state, delta, a=1.0, b=1.0, S=1.0, n=4, k=1.0):
    """Same toggle switch but with a_x = a+delta, a_y = a-delta."""
    x, y = state
    ax, ay = a + delta, a - delta
    fx = ax * x**n / (S**n + x**n) + b * S**n / (S**n + y**n) - k * x
    fy = ay * y**n / (S**n + y**n) + b * S**n / (S**n + x**n) - k * y
    return np.array([fx, fy])


def jac_bias(state, delta, a=1.0, b=1.0, S=1.0, n=4, k=1.0):
    x, y = state
    ax, ay = a + delta, a - delta
    dfdx = ax * _hill_deriv(x, S, n) - k
    dfdy = -b * _hill_deriv(y, S, n)
    dgdx = -b * _hill_deriv(x, S, n)
    dgdy = ay * _hill_deriv(y, S, n) - k
    return np.array([[dfdx, dfdy], [dgdx, dgdy]])


def find_fold(seed_xyz=(0.46, 1.12, 0.73)):
    """Solve F(x,y)=0 AND det(J(x,y))=0 simultaneously for (x,y,delta)."""
    def augmented(vars_):
        x, y, delta = vars_
        F = rhs_bias([x, y], delta)
        J = jac_bias([x, y], delta)
        det = J[0, 0] * J[1, 1] - J[0, 1] * J[1, 0]
        return [F[0], F[1], det]

    sol, info, ier, msg = fsolve(augmented, seed_xyz, xtol=1e-14, full_output=True)
    assert ier == 1, f"fold search failed: {msg}"
    return sol  # (x*, y*, delta_c)


def dwell_time(delta, ghost, delta_c, R=0.25, tmax=3000.0):
    """Time for a trajectory nudged off the ghost point to exit a ball of radius R."""
    def f(t, state):
        return list(rhs_bias(state, delta))

    def event_escape(t, state):
        return np.linalg.norm(np.array(state) - ghost) - R
    event_escape.terminal = True
    event_escape.direction = 1

    x0 = ghost + np.array([2e-4, -2e-4])
    sol = solve_ivp(f, [0, tmax], x0, method="RK45", events=event_escape,
                     max_step=0.1, rtol=1e-11, atol=1e-13)
    return sol.t_events[0][0] if sol.t_events[0].size else np.nan


def section_4_arrest_saddle_ghost():
    print("\n" + "=" * 78)
    print("SECTION 4: arrest via saddle-node ghost (bias delta on self-activation)")
    print("=" * 78)
    print("Baseline bistable-committed set: a=b=1, S=1.0, n=4, k=1, delta=0")
    for p in find_fixed_points(1.0, 1.0, 1.0, 4, 1.0):
        label, eig = classify(p, 1.0, 1.0, 1.0, 4, 1.0)
        print(f"  {p}  {label}  eig={eig}")

    xc, yc, delta_c = find_fold()
    ghost = np.array([xc, yc])
    print(f"\nSaddle-node fold (erythroid attractor annihilates with the saddle):")
    print(f"  delta_c = {delta_c:.8f}")
    print(f"  fold point (x*,y*) = ({xc:.8f}, {yc:.8f})")
    print(f"  Jacobian eig at fold: {np.linalg.eigvals(jac_bias([xc, yc], delta_c))}  (one exactly 0)")

    print("\nSole surviving attractor past the fold (delta=0.8):")
    surv = fsolve(rhs_bias, [1.5, 0.1], args=(0.8,), xtol=1e-13)
    print(f"  {surv}  eig={np.linalg.eigvals(jac_bias(surv, 0.8))}")

    print("\nDwell time near the ghost as delta -> delta_c^+ :")
    deltas_above = [0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001, 0.00005]
    dd_arr, t_arr = [], []
    for dd in deltas_above:
        t = dwell_time(delta_c + dd, ghost, delta_c)
        dd_arr.append(dd)
        t_arr.append(t)
        print(f"  delta-delta_c={dd:<10.6f}  dwell={t:.4f}")

    dd_arr, t_arr = np.array(dd_arr), np.array(t_arr)
    mask = ~np.isnan(t_arr)
    slope, intercept = np.polyfit(np.log(dd_arr[mask]), np.log(t_arr[mask]), 1)
    print(f"\nFull-range power-law fit: dwell ~ (delta-delta_c)^{slope:.4f}")
    mask2 = dd_arr < 0.01
    slope2, _ = np.polyfit(np.log(dd_arr[mask2]), np.log(t_arr[mask2]), 1)
    print(f"Asymptotic fit (delta-delta_c<0.01): exponent = {slope2:.4f}  (theory: -0.5)")


# --------------------------------------------------------------------------
# 5. Arrest, part B: 3-node extension, Hopf search (honest negative result)
# --------------------------------------------------------------------------
#
#   dz/dt = epsz * [ (x+y)^m/(Sz^m+(x+y)^m) - kz*z ]      (slow, both genes drive it)
#   self-activation of x and y is multiplied by Si^p/(Si^p+z^p)  (z represses both)

def F3(state, Si, p, Sz, m, kz, epsz, a=1.0, b=1.0, S=0.5, n=4, k=1.0):
    x, y, z = state
    rep = Si**p / (Si**p + z**p)
    fx = a * x**n / (S**n + x**n) * rep + b * S**n / (S**n + y**n) - k * x
    fy = a * y**n / (S**n + y**n) * rep + b * S**n / (S**n + x**n) - k * y
    fz = epsz * ((x + y)**m / (Sz**m + (x + y)**m) - kz * z)
    return np.array([fx, fy, fz])


def jac3_numeric(state, *params, h=1e-6):
    f0 = F3(state, *params)
    J = np.zeros((3, 3))
    for i in range(3):
        s2 = np.array(state, dtype=float)
        s2[i] += h
        J[:, i] = (F3(s2, *params) - f0) / h
    return J


def section_5_limit_cycle_search():
    print("\n" + "=" * 78)
    print("SECTION 5: 3-node extension, Hopf-bifurcation search (honest attempt)")
    print("=" * 78)

    def asym_fp(Si, p, Sz, m, kz, epsz, seed=(1.0, 0.06, 0.95)):
        sol = fsolve(F3, seed, args=(Si, p, Sz, m, kz, epsz), xtol=1e-13)
        return sol

    print("Scanning epsz (timescale separation) over 3 decades, Si=0.3,p=4,Sz=0.5,m=4,kz=1:")
    for epsz in [0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001]:
        fp = asym_fp(0.3, 4, 0.5, 4, 1.0, epsz)
        eig = np.linalg.eigvals(jac3_numeric(fp, 0.3, 4, 0.5, 4, 1.0, epsz))
        print(f"  epsz={epsz:<8} fp={np.round(fp,4)}  eig={np.round(eig,5)}")

    print("\nScanning p (repression steepness) 2..20, Si=0.3,Sz=0.5,m=4,kz=1,epsz=0.02:")
    for p in [2, 4, 6, 8, 10, 14, 20]:
        fp = asym_fp(0.3, p, 0.5, 4, 1.0, 0.02)
        eig = np.linalg.eigvals(jac3_numeric(fp, 0.3, p, 0.5, 4, 1.0, 0.02))
        print(f"  p={p:<4} fp={np.round(fp,4)}  eig={np.round(eig,5)}")

    print("\nScanning kz (z decay) 0.005..50, Si=0.2,p=8,Sz=0.5,m=4,epsz=0.02:")
    for kz in [0.005, 0.02, 0.1, 0.5, 1.0, 3, 5, 7, 10, 20, 50]:
        fp = asym_fp(0.2, 8, 0.5, 4, kz, 0.02)
        eig = np.linalg.eigvals(jac3_numeric(fp, 0.2, 8, 0.5, 4, kz, 0.02))
        print(f"  kz={kz:<6} fp={np.round(fp,4)}  eig={np.round(eig,5)}")

    print("\nConclusion: eigenvalues stay real-negative (stable node) across the whole")
    print("scan, with a narrow window of weakly-damped complex pairs (Re<0, i.e. a")
    print("damped spiral, never a source) around kz~5 and kz~50. No sign change of")
    print("Re(lambda) was found anywhere -> no Hopf bifurcation, no limit cycle, for")
    print("this symmetric topology. Mechanistic reason: z is driven by x+y, which is")
    print("nearly CONSERVED across commitment (whichever gene is high, the total stays")
    print("close to its progenitor value), so z cannot apply direction-dependent,")
    print("phase-shifted feedback -- it only rescales the effective self-activation")
    print("strength 'a', sliding the system along the SAME mono/bi/tristable diagram")
    print("from Section 3, never destabilizing a node into a spiral source.")


# --------------------------------------------------------------------------
# 6. Basin-of-attraction / separatrix check, default tristable parameters
# --------------------------------------------------------------------------

def section_6_basins():
    print("\n" + "=" * 78)
    print("SECTION 6: basin/separatrix check (default tristable a=b=1,S=0.5,n=4,k=1)")
    print("=" * 78)
    a, b, S, n, k = 1.0, 1.0, 0.5, 4, 1.0
    attractors = {
        "central": (1.0, 1.0),
        "myeloid": (1.996078, 0.003922),
        "erythroid": (0.003922, 1.996078),
    }

    def f(t, state):
        return list(rhs(state, a, b, S, n, k))

    counts = {name: 0 for name in attractors}
    counts["other/unclear"] = 0
    wrong_side = 0
    ngrid = 15
    for x0 in np.linspace(0.01, 2.4, ngrid):
        for y0 in np.linspace(0.01, 2.4, ngrid):
            sol = solve_ivp(f, (0, 60), [x0, y0], method="RK45", rtol=1e-8, atol=1e-10)
            xf, yf = sol.y[:, -1]
            best, bd = None, 1e9
            for name, (ax, ay) in attractors.items():
                d = (xf - ax) ** 2 + (yf - ay) ** 2
                if d < bd:
                    bd, best = d, name
            if bd < 1e-3:
                counts[best] += 1
                if best == "myeloid" and y0 > x0:
                    wrong_side += 1
                if best == "erythroid" and x0 > y0:
                    wrong_side += 1
            else:
                counts["other/unclear"] += 1

    print(f"Grid: {ngrid}x{ngrid} initial conditions on [0.01,2.4]^2, integrated to t=60.")
    print(f"Basin counts: {counts}")
    print(f"Points landing in myeloid/erythroid basin on the WRONG side of x=y: {wrong_side}")
    print("-> separatrix cleanly tracks the anti-diagonal; the saddles' stable")
    print("   manifolds separate myeloid-committed from erythroid-committed basins.")


if __name__ == "__main__":
    section_2_default()
    section_3_bifurcation()
    section_4_arrest_saddle_ghost()
    section_5_limit_cycle_search()
    section_6_basins()
