const radius = { walk: .32, bike: .29, car: .79 };
const axleOffsets = { walk: [0], bike: [-.66, 0, .66], car: [-1.02, 0, 1.02] };

export function districtClear(x, z, yaw, kind, bounds, boxes, vehicles, ignored) {
  const r = radius[kind];
  return axleOffsets[kind].every((offset) => {
    const px = x + Math.sin(yaw) * offset;
    const pz = z + Math.cos(yaw) * offset;
    if (Math.abs(px) > bounds.x - r || Math.abs(pz) > bounds.z - r) return false;
    for (const box of boxes) {
      const dx = Math.max(0, Math.abs(px - box.x) - box.w);
      const dz = Math.max(0, Math.abs(pz - box.z) - box.d);
      if (dx * dx + dz * dz < r * r) return false;
    }
    for (const vehicle of vehicles) {
      if (vehicle === ignored) continue;
      for (const axle of axleOffsets[vehicle.kind]) {
        const dx = px - vehicle.x - Math.sin(vehicle.yaw) * axle;
        const dz = pz - vehicle.z - Math.cos(vehicle.yaw) * axle;
        if (dx * dx + dz * dz < (r + radius[vehicle.kind]) ** 2) return false;
      }
    }
    return true;
  });
}

// Small steps keep even the fastest vehicle from skipping over thin walls.
export function moveDistrictBody(body, dx, dz, yaw, clear, slide = false) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .11));
  const x0 = body.x, z0 = body.z;
  const angle = Math.atan2(Math.sin(yaw - body.yaw), Math.cos(yaw - body.yaw));
  let blocked = false;
  for (let step = 0; step < steps; step++) {
    const heading = body.yaw + angle / steps;
    const x = body.x + dx / steps, z = body.z + dz / steps;
    if (clear(x, z, heading)) {
      body.x = x; body.z = z; body.yaw = heading;
      continue;
    }
    blocked = true;
    if (!slide) break;
    if (dx && clear(x, body.z, heading)) body.x = x;
    if (dz && clear(body.x, z, heading)) body.z = z;
    body.yaw = heading;
  }
  return { distance: Math.hypot(body.x - x0, body.z - z0), blocked };
}
