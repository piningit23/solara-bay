import * as THREE from 'three';
import { material } from './models.js';

export function createEffects(scene) {
  const particles = [];
  const geometry = new THREE.BoxGeometry(.17, .17, .17);
  function burst(x, y, z, color = '#ffd786', count = 10, force = 4) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material(color, { emissive: color, emissiveIntensity: .7 }));
      mesh.position.set(x, y, z);
      scene.add(mesh);
      particles.push({ mesh, vx: (Math.random() - .5) * force, vy: Math.random() * force, vz: (Math.random() - .5) * force, life: .3 + Math.random() * .4 });
    }
  }
  function tracer(from, to, color = '#ffe99a') {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(from.x, from.y || 1.4, from.z), new THREE.Vector3(to.x, to.y || 1.2, to.z)]);
    const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .85 }));
    scene.add(mesh);
    particles.push({ mesh, vx: 0, vy: 0, vz: 0, life: .08, line: true });
  }
  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { scene.remove(p.mesh); if (p.line) { p.mesh.geometry.dispose(); p.mesh.material.dispose(); } particles.splice(i, 1); continue; }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= dt * 5;
      if (!p.line) p.mesh.scale.setScalar(Math.min(1, p.life * 4));
    }
  }
  return { burst, tracer, update };
}
