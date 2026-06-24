import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import fontJson from "three/examples/fonts/helvetiker_bold.typeface.json";
import { WiggleBone } from "wiggle";

const SEGMENTS = 5;
const SEGMENT_LENGTH = 12;
const FRAME_MS = 1000 / 60;

const font = new FontLoader().parse(fontJson);

export default function WigglePointer() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return undefined;
    }

    const media = window.matchMedia("(pointer: fine)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!media.matches || motionMedia.matches) {
      return undefined;
    }

    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return undefined;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "wiggle-pointer-canvas";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    camera.position.z = 100;

    const ambient = new THREE.AmbientLight(0xf7efe3, 1.15);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffd2a8, 1.05);
    key.position.set(-40, 50, 80);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc3d4e8, 0.7);
    fill.position.set(55, -10, 50);
    scene.add(fill);

    const root = new THREE.Bone();
    scene.add(root);

    const chain = [root];
    let current = root;

    for (let index = 0; index < SEGMENTS; index += 1) {
      const bone = new THREE.Bone();
      bone.position.set(0, -SEGMENT_LENGTH, 0);
      current.add(bone);
      chain.push(bone);
      current = bone;
    }

    const wiggles = chain.slice(1).map(
      (bone, index) =>
        new WiggleBone(bone, {
          stiffness: 340 - index * 22,
          damping: 17 + index * 0.7,
        }),
    );

    const tetherGeometry = new THREE.BufferGeometry();
    const tetherPositions = new Float32Array(chain.length * 3);
    tetherGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(tetherPositions, 3),
    );

    const tether = new THREE.Line(
      tetherGeometry,
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#8f3a31"),
        transparent: true,
        opacity: 0.28,
      }),
    );
    scene.add(tether);

    const anchor = new THREE.Mesh(
      new THREE.CircleGeometry(3.8, 24),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#c28e5d"),
        transparent: true,
        opacity: 0.2,
      }),
    );
    scene.add(anchor);

    const pointerCore = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 24),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#38516e"),
        transparent: true,
        opacity: 0.74,
      }),
    );
    scene.add(pointerCore);

    const pendant = new THREE.Group();
    chain[chain.length - 1].add(pendant);
    pendant.position.set(0, -5.4, 0);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.33, 16, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c59a63"),
        metalness: 0.38,
        roughness: 0.42,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    pendant.add(ring);

    const piGeometry = new TextGeometry("π", {
      font,
      size: 12.5,
      depth: 2.8,
      curveSegments: 12,
      bevelEnabled: true,
      bevelSize: 0.45,
      bevelThickness: 0.55,
      bevelSegments: 5,
    });
    piGeometry.center();

    const piShadow = new THREE.Mesh(
      piGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#2b211a"),
        transparent: true,
        opacity: 0.12,
      }),
    );
    piShadow.position.set(1.2, -1.8, -3.8);
    piShadow.scale.set(1.02, 1.02, 1.02);
    pendant.add(piShadow);

    const piMesh = new THREE.Mesh(
      piGeometry,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#b85a43"),
        metalness: 0.22,
        roughness: 0.34,
      }),
    );
    piMesh.rotation.x = 0.12;
    pendant.add(piMesh);

    const piAccent = new THREE.Mesh(
      piGeometry,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#38516e"),
        metalness: 0.05,
        roughness: 0.5,
        transparent: true,
        opacity: 0.2,
      }),
    );
    piAccent.position.set(0.5, 0.12, -1.4);
    pendant.add(piAccent);

    const target = new THREE.Vector3(0, 0, 0);
    const position = new THREE.Vector3(0, 0, 0);
    const previous = new THREE.Vector3(0, 0, 0);
    const worldPoint = new THREE.Vector3();
    let width = 1;
    let height = 1;
    let raf = 0;
    let last = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
    };

    const setTarget = (event) => {
      target.set(
        event.clientX - width / 2 + 20,
        -(event.clientY - height / 2) - 14,
        0,
      );
    };

    const updateTether = () => {
      chain.forEach((bone, index) => {
        bone.getWorldPosition(worldPoint);
        tetherPositions[index * 3] = worldPoint.x;
        tetherPositions[index * 3 + 1] = worldPoint.y;
        tetherPositions[index * 3 + 2] = worldPoint.z;
      });

      tetherGeometry.attributes.position.needsUpdate = true;
      tetherGeometry.computeBoundingSphere();
    };

    const animate = (now) => {
      if (now - last < FRAME_MS) {
        raf = window.requestAnimationFrame(animate);
        return;
      }

      const delta = Math.min((now - last) / 1000 || FRAME_MS / 1000, 0.04);
      last = now;

      previous.copy(position);
      position.lerp(target, 0.2);
      root.position.copy(position);

      const dx = position.x - previous.x;
      const dy = position.y - previous.y;

      root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, dx * 0.018, 0.11);
      root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -dy * 0.0035, 0.08);

      wiggles.forEach((wiggle) => wiggle.update(delta));
      updateTether();

      anchor.position.copy(position);
      pointerCore.position.copy(position);
      pendant.rotation.y = THREE.MathUtils.lerp(pendant.rotation.y, dx * 0.01, 0.08);
      pendant.rotation.x = THREE.MathUtils.lerp(pendant.rotation.x, -dy * 0.004, 0.08);

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };

    resize();
    target.set(0, 0, 0);
    position.set(0, 0, 0);
    updateTether();
    raf = window.requestAnimationFrame(animate);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", setTarget, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", setTarget);
      window.cancelAnimationFrame(raf);
      wiggles.forEach((wiggle) => wiggle.dispose());
      tetherGeometry.dispose();
      tether.material.dispose();
      anchor.geometry.dispose();
      anchor.material.dispose();
      pointerCore.geometry.dispose();
      pointerCore.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      piGeometry.dispose();
      piShadow.material.dispose();
      piMesh.material.dispose();
      piAccent.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="wiggle-pointer-layer" ref={mountRef} aria-hidden="true" />;
}
