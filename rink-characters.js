import * as THREE from 'three';

export const skaterLooks = [
  { height: 1, build: 0, skin: 0xffebdd, face: { jaw_narrow: .26, chin_soft: .2 } },
  { height: .92, build: -.42, skin: 0xb88979, face: { jaw_narrow: .78, nose_small: .57, cheeks_thin: .52 } },
  { height: 1.08, build: .7, skin: 0xe9ad8b, face: { jaw_wide: .76, chin_strong: .65, brow_heavy: .5 } },
  { height: .974, build: .16, skin: 0xffe4bc, face: { chin_soft: .72, cheeks_full: .65, nose_small: .4 } },
  { height: 1.11, build: -.26, skin: 0xcd9d84, face: { nose_big: .74, cheeks_thin: .72, ears_big: .58 } },
  { height: 1.027, build: .51, skin: 0xe1bea4, face: { jaw_wide: .49, brow_soft: .67, cheeks_full: .57 } },
];

export function styleSkater(model, look) {
  model.scale.setScalar(look.height);
  model.traverse((mesh) => {
    if (!mesh.isMesh) return;
    if (mesh.material.name === 'M_skin') {
      mesh.material = mesh.material.clone();
      mesh.material.color.setHex(look.skin);
    }
    const values = {
      body_slim: Math.max(0,-look.build), body_strong: Math.max(0,look.build), ...look.face,
    };
    for (const [name,value] of Object.entries(values)) {
      const target = mesh.morphTargetDictionary?.[name];
      if (target !== undefined) mesh.morphTargetInfluences[target] = value;
    }
  });
}

export function stripeOfficial(model) {
  model.traverse((mesh) => {
    if (mesh.material?.name !== 'M_kit') return;
    const shirt = new THREE.MeshStandardMaterial({ roughness: .88 });
    shirt.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 uniformRest;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nuniformRest = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 uniformRest;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float band = step(0.52, fract(uniformRest.x * 19.0 + 0.5));
          float cuff = step(0.35, abs(uniformRest.x)) * step(0.95, uniformRest.y) * (1.0-step(1.08, uniformRest.y));
          vec3 striped = mix(vec3(0.028, 0.034, 0.045), vec3(0.83, 0.86, 0.88), band);
          diffuseColor.rgb = uniformRest.y > 0.89 ? mix(striped, vec3(0.9, 0.22, 0.04), cuff) : vec3(0.026, 0.029, 0.036);`);
    };
    mesh.material.dispose();
    mesh.material = shirt;
  });
}

// Freeze posed spectators to regular geometry so the stands can use instanced draws.
export function bakeSpectator(model) {
  model.updateMatrixWorld(true);
  const baked = [];
  const point = new THREE.Vector3(), edge = new THREE.Vector3(), direction = new THREE.Vector3();
  model.traverse((mesh) => {
    if (!mesh.isSkinnedMesh || mesh.name === 'Stick') return;
    mesh.skeleton.update();
    const source = mesh.geometry;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(source.attributes.position.count * 3);
    const normals = new Float32Array(positions.length);
    const { normal, position } = source.attributes;
    for (let index=0;index<position.count;index++) {
      mesh.getVertexPosition(index,point).applyMatrix4(mesh.matrixWorld).toArray(positions,index*3);
      // Treat the normal as a short edge to carry it through the same skinning transforms.
      edge.fromBufferAttribute(position,index).addScaledVector(direction.fromBufferAttribute(normal,index),.01);
      mesh.applyBoneTransform(index,edge).applyMatrix4(mesh.matrixWorld);
      point.fromBufferAttribute(position,index);
      mesh.applyBoneTransform(index,point).applyMatrix4(mesh.matrixWorld);
      edge.sub(point).normalize().toArray(normals,index*3);
    }
    geometry.setIndex(source.index);
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
    if (source.attributes.uv) geometry.setAttribute('uv',source.attributes.uv);
    const material = mesh.material.clone();
    const clothing = material.name === 'M_kit';
    if (clothing) {
      material.map = null;
      material.color.set(0xffffff);
      material.roughness = .95;
    }
    baked.push({ geometry,material,clothing });
  });
  return baked;
}
