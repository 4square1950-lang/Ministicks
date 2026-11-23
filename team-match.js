const goalLine = 6.25;
const ballRadius = .045;
const stepLength = .55;
const clockRate = 4;
const periodLength = 300;
const faceoffStages = [1.4, 3, 3];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const statLine = () => ({ goals: 0, assists: 0, shots: 0, onTarget: 0, saves: 0, steals: 0, passes: 0, travels: 0, freezes: 0, against: 0 });
const flip = (side) => 1 - side;
export const attackDirection = (game, side) => (side ? -1 : 1) * (game.period % 2 ? 1 : -1);

export function createTeamMatch({ home, away, playerName, local = false, training = false, surface = 'carpet', demo = false }) {
  const players = [playerName, 'Home teammate', 'Home goalie', local ? 'Player 2' : 'Away captain', 'Away teammate', 'Away goalie']
    .map((name, id) => ({ id, name, side: Number(id >= 3), goalie: id % 3 === 2,
      stats: statLine(), x: 0, z: 0, vx: 0, vz: 0, yaw: 0, stride: 0, steps: 0, walking: false, action: null }));
  const game = { teams: [home, away], local, training, demo, surface, players, controls: demo ? [] : local ? [0, 3] : [0], remaining: periodLength, period: 1,
    scores: [0, 0], ball: { x: 0, y: .052, z: 0, flight: null }, owner: 0, cooldown: 0, sincePossession: 0,
    lastPass: null, resetDelay: 0, restartSide: 0, message: 'Faceoff', ended: false,
    freeze: null, faceoff: null, intermission: 0, timeout: 0, usedTimeout: [false, false], stoppage: null, event: null, eventId: 0 };
  faceoff(game, 0);
  return game;
}

function claim(game, player, reason) {
  game.owner = player.id;
  game.ball.flight = null;
  game.sincePossession = 0;
  game.cooldown = .45;
  game.stealShield = 1.12;
  player.steps = 0; player.stride = 0; player.walking = false; player.onFeet = false;
  if (reason) game.message = reason;
}

function report(game, type, text, side) {
  game.event = { id: ++game.eventId, type, text, side };
  game.message = text;
}

function faceoff(game, side) {
  for (const player of game.players) {
    const direction = attackDirection(game, player.side);
    player.x = player.goalie ? 0 : (player.id % 3 === 0 ? -.56 * direction : 2.15 * direction);
    player.z = player.goalie ? -direction * 5.82 : -direction * (player.id % 3 === 0 ? .85 : 1.7);
    player.yaw = direction < 0 ? Math.PI : 0;
    player.action = null;
    player.steps = 0; player.stride = 0; player.onFeet = false; player.walking = false;
  }
  game.lastPass = null;
  if (game.demo || game.training) {
    claim(game, game.players[side * 3], 'Faceoff · ' + game.teams[side] + ' possession');
    return;
  }
  game.owner = null;
  game.ball.x = 0; game.ball.z = 0; game.ball.y = .054; game.ball.flight = null;
  game.faceoff = { stage: 0, elapsed: 0, grades: [0, 0], locked: [false, false], side };
  report(game, 'faceoff', 'Center faceoff');
}

export function tapFaceoff(game, side) {
  const draw = game.faceoff;
  if (!draw || draw.locked[side] || game.timeout > 0) return false;
  draw.locked[side] = true;
  const center = faceoffStages[draw.stage] * .52;
  draw.grades[side] += Math.max(0, 1 - Math.abs(draw.elapsed - center) / center);
  return true;
}

function updateFaceoff(game, dt) {
  const draw = game.faceoff;
  draw.elapsed += dt;
  if (!game.local && draw.elapsed >= faceoffStages[draw.stage] * .72) tapFaceoff(game, 1);
  if (draw.elapsed < faceoffStages[draw.stage] && !draw.locked.every(Boolean)) return;
  if (++draw.stage < faceoffStages.length) {
    draw.elapsed = 0; draw.locked = [false, false]; return;
  }
  const side = draw.grades[0] === draw.grades[1] ? draw.side : Number(draw.grades[1] > draw.grades[0]);
  game.faceoff = null;
  claim(game, game.players[side * 3], game.teams[side] + ' wins the draw');
}

export function callTimeout(game, side) {
  if (!game || game.demo || game.training || game.ended || game.timeout || game.usedTimeout[side] ||
      !(game.faceoff || game.freeze || game.resetDelay || game.stoppage)) return false;
  game.usedTimeout[side] = true;
  game.timeout = 30;
  report(game, 'timeout', game.teams[side] + ' timeout', side);
  return true;
}

function traveling(game, player) {
  player.stats.travels++;
  player.onFeet = false; player.walking = false; player.steps = 0; player.stride = 0;
  game.ball.flight = null;
  game.owner = null;
  game.lastPass = null;
  game.stoppage = { player: player.id, side: flip(player.side), left: 1.1 };
  report(game, 'travel', 'Traveling · ' + player.name, player.side);
}

export function switchSkater(game, seat) {
  const id = game.controls[seat];
  if (id === undefined || game.resetDelay > 0) return;
  const other = game.players[id + (id % 3 === 0 ? 1 : -1)];
  game.controls[seat] = other.id;
}

const windup = { shot: 11 / 30, pass: 9 / 30, poke: .4, save: .4, goal: .8 };
function pushAction(player, kind) { player.action = { kind, remaining: windup[kind] }; }
function trySteal(game, player) {
  if (game.owner === null || game.stealShield > 0 || player.action) return;
  const carrier = game.players[game.owner];
  if (carrier.side === player.side || carrier.goalie || distance(player, carrier) > .75) return;
  if (player.onFeet && player.steps >= 3) { traveling(game, player); return; }
  pushAction(player, 'poke');
  player.stats.steals++;
  game.lastPass = null;
  claim(game, player, player.name + ' takes possession');
}

export function teamAction(game, id, kind, aim = 0) {
  if (game.ended || game.resetDelay || game.faceoff || game.freeze || game.stoppage || game.intermission || game.timeout || id === undefined) return false;
  const player = game.players[id];
  if (player.onFeet && player.steps >= 3 && game.owner === id) {
    traveling(game, player); return false;
  }
  if (game.owner !== id) {
    if (kind === 'poke') trySteal(game, player);
    return false;
  }
  if (game.cooldown > 0 || player.action) return false;
  if (kind !== 'pass' && kind !== 'shot') return false;
  const teammate = game.players[id + (id % 3 === 0 ? 1 : -1)];
  const direction = attackDirection(game, player.side);
  const target = kind === 'pass' ? { x: teammate.x, z: teammate.z, id: teammate.id } :
    { x: clamp(aim, -2.6, 2.6), z: direction * (goalLine + .12), id: null };
  player.yaw = Math.atan2(target.x - player.x, target.z - player.z);
  pushAction(player, kind);
  player.action.target = target;
  return true;
}

function release(game, player, action) {
  if (game.owner !== player.id || !action.target) return;
  const { ball } = game;
  const target = action.target;
  const length = Math.max(.15, distance(ball,target));
  const speed = action.kind === 'pass' ? 11.5 : 16.5;
  ball.flight = { from: player.id, kind: action.kind, intended: target.id,
    vx: (target.x - ball.x) * speed / length, vz: (target.z - ball.z) * speed / length, age: 0 };
  ball.y = .075;
  game.owner = null;
  game.cooldown = .14;
  if (action.kind === 'shot') player.stats.shots++;
}

function skate(game, player, dx, dz, standing, dt) {
  const length = Math.hypot(dx, dz);
  const hasBall = game.owner === player.id;
  if (!standing || hasBall) { player.steps = 0; player.stride = 0; }
  player.onFeet = Boolean(standing && !hasBall && !player.goalie && (length > .01 || player.onFeet));
  player.walking = player.onFeet && length > .01;
  const speed = player.walking ? 4.35 : hasBall ? 2.5 : 3.05;
  if (player.goalie || player.action?.target || length < .01) { player.vx = player.vz = 0; return; }
  const maxDistance = player.walking ? Math.min(dt * speed, stepLength - player.stride) : dt * speed;
  const previous = { x: player.x, z: player.z };
  player.x = clamp(player.x + dx / Math.max(1, length) * maxDistance, -5.48, 5.48);
  player.z = clamp(player.z + dz / Math.max(1, length) * maxDistance, -5.46, 5.46);
  for (const other of game.players) {
    if (player === other) continue;
    const separation = distance(player, other);
    if (separation < .52 && distance(previous, other) >= separation) {
      player.x = previous.x;
      player.z = previous.z;
      break;
    }
  }
  if (player.walking) {
    player.stride += distance(previous, player);
    if (player.stride >= stepLength - .00001) {
      player.stride = Math.max(0, player.stride - stepLength);
      player.steps++;
      if (player.steps === 4) traveling(game, player);
    }
  }
  player.vx = (player.x - previous.x) / dt;
  player.vz = (player.z - previous.z) / dt;
  if (Math.hypot(player.vx, player.vz) > .06) player.yaw = Math.atan2(player.vx, player.vz);
}

function bot(game, player, dt) {
  const direction = attackDirection(game, player.side);
  const carrier = game.owner === null ? null : game.players[game.owner];
  const ball = game.ball;
  if (player.goalie) {
    const flight = ball.flight;
    const intercept = flight?.kind === 'shot' && flight.age > .17 && flight.vz * player.z > 0
      ? ball.x + flight.vx * (player.z - ball.z) / flight.vz : null;
    const target = clamp(intercept ?? ball.x * .32, -1.44, 1.44);
    const speed = intercept === null ? 2.55 : 4.5;
    player.x += clamp(target - player.x, -dt * speed, dt * speed);
    return;
  }
  let x, z;
  if (carrier === player) {
    x = player.x >= 0 ? 2.2 : -2.2;
    z = direction * 3.8;
    if (player.z * direction > .25 && game.sincePossession > .66) {
      const goalie = game.players[flip(player.side) * 3 + 2];
      const angle = .62 + .84 * (1 + Math.sin(game.remaining * .91 + player.id)) / 2;
      teamAction(game, player.id, 'shot', goalie.x > 0 ? -angle : angle);
    }
    const mark = game.players.filter((other) => other.side !== player.side && !other.goalie).some((other) => distance(other, player) < .81);
    const teammate = game.players[player.id + (player.id % 3 === 0 ? 1 : -1)];
    if (mark && game.sincePossession > .60 && (teammate.z-player.z)*direction > .95) teamAction(game, player.id, 'pass');
  } else if (carrier?.side === player.side) {
    x = carrier.x > 0 ? -2.6 : 2.6;
    z = clamp(carrier.z + direction * 1.65, -4.85, 4.85);
  } else {
    const partner = game.players[player.id + (player.id % 3 === 0 ? 1 : -1)];
    const chase = distance(player, ball) < distance(partner, ball) || game.controls.includes(partner.id);
    x = chase ? ball.x : clamp(ball.x * .40, -2.4, 2.4);
    z = chase ? ball.z : clamp(ball.z - direction * 1.84, -4.8, 4.8);
    if (chase) trySteal(game, player);
  }
  skate(game, player, clamp((x - player.x) * 2, -1, 1), clamp((z - player.z) * 2, -1, 1), false, dt);
}

function updateBall(game, dt) {
  const ball = game.ball;
  const carrier = game.owner === null ? null : game.players[game.owner];
  if (carrier) {
    ball.x = carrier.x + Math.sin(carrier.yaw) * .40 + Math.cos(carrier.yaw) * .19;
    ball.z = carrier.z + Math.cos(carrier.yaw) * .40 - Math.sin(carrier.yaw) * .19;
    ball.y = .054;
    return;
  }
  const flight = ball.flight;
  if (flight) {
    flight.age += dt;
    const previousZ = ball.z;
    ball.x += flight.vx * dt;
    ball.z += flight.vz * dt;
    ball.y = flight.kind === 'shot' ? .08 + Math.sin(Math.min(1, flight.age * 1.5) * Math.PI) * .39 : .065;
    const side = ball.z * attackDirection(game, 0) > 0 ? 1 : 0;
    const keeper = game.players[side * 3 + 2];
    const shooter = game.players[flight.from];
    const crossKeeper = Math.sign(previousZ - keeper.z) !== Math.sign(ball.z - keeper.z);
    if (flight.kind === 'shot' && crossKeeper && shooter.side !== side && Math.abs(ball.x - keeper.x) < .41) {
      const projected = ball.x + flight.vx * ((Math.sign(ball.z) * goalLine) - ball.z) / flight.vz;
      if (Math.abs(projected) + ballRadius < 1.615 && ball.y + ballRadius < 1.12) {
        shooter.stats.onTarget++; keeper.stats.saves++;
      }
      pushAction(keeper, 'save');
      game.lastPass = null;
      claim(game, keeper, keeper.name + ' makes the save');
      keeper.stats.freezes++;
      game.freeze = { keeper:keeper.id, left:3 };
      report(game, 'save', keeper.name + ' freezes the ball', keeper.side);
      return;
    }
    if (flight.kind === 'shot' && Math.abs(ball.z) >= goalLine + ballRadius && Math.abs(previousZ) < goalLine + ballRadius &&
        Math.abs(ball.x) + ballRadius < 1.615 && ball.y + ballRadius < 1.12 && shooter.side !== side) {
      shooter.stats.goals++; shooter.stats.onTarget++;
      if (game.lastPass?.receiver === shooter.id) game.players[game.lastPass.from].stats.assists++;
      game.scores[shooter.side]++;
      keeper.stats.against++;
      report(game, 'goal', 'Goal · ' + shooter.name, shooter.side);
      game.restartSide = side;
      game.resetDelay = 1.4;
      ball.flight = null;
      pushAction(shooter, 'goal');
      if (!game.demo && game.period === 4) game.ended = true;
      return;
    }
    if (Math.abs(ball.x) > 5.68) { ball.x = clamp(ball.x, -5.68, 5.68); flight.vx *= -.64; }
    if (Math.abs(ball.z) > 7.6) { ball.z = clamp(ball.z, -7.6, 7.6); flight.vz *= -.60; }
    const drag = game.surface === 'plastic' ? .80 : 1.12;
    const decay = Math.exp(-dt * drag * (flight.kind === 'pass' ? 1.05 : .69));
    flight.vx *= decay;
    flight.vz *= decay;
    if (Math.hypot(flight.vx, flight.vz) < .91) { ball.flight = null; ball.y = .054; }
  }
  if (game.cooldown > 0) return;
  const nearby = game.players.filter((player) => !player.goalie && distance(player, ball) < (player.id === flight?.intended ? .64 : .44))
    .sort((a, b) => distance(a, ball) - distance(b, ball))[0];
  if (!nearby) return;
  if (nearby.onFeet && nearby.steps >= 3) { traveling(game, nearby); return; }
  const passer = flight && game.players[flight.from];
  if (flight?.kind === 'pass' && passer.side === nearby.side && passer.id !== nearby.id) {
    passer.stats.passes++;
    game.lastPass = { from: passer.id, receiver: nearby.id };
    const seat = game.controls.indexOf(passer.id);
    if (seat !== -1) game.controls[seat] = nearby.id;
  } else if (game.lastPass?.receiver !== nearby.id) game.lastPass = null;
  claim(game, nearby, nearby.name + ' has the ball');
}

export function tickTeamMatch(game, inputs, dt) {
  if (game.ended || dt <= 0) return;
  if (game.timeout > 0) { game.timeout = Math.max(0, game.timeout - dt); return; }
  if (game.intermission > 0) {
    game.intermission = Math.max(0, game.intermission - dt);
    if (!game.intermission) faceoff(game, game.period % 2 ? 0 : 1);
    return;
  }
  if (game.faceoff) { updateFaceoff(game, dt); return; }
  const stopped = game.resetDelay || game.freeze || game.stoppage;
  const stopClock = game.period === 3 && game.remaining <= 60 && Math.abs(game.scores[0] - game.scores[1]) <= 2;
  if (!game.training && !game.demo && (!stopped || !stopClock)) {
    game.remaining = Math.max(0, game.remaining - dt * clockRate);
    if (!game.remaining) {
      if (game.period === 4 || (game.period === 3 && game.scores[0] !== game.scores[1])) {
        game.ended = true; report(game, 'horn', 'Full time');
      } else {
        game.period++; game.remaining = periodLength; game.intermission = 60 / clockRate;
        game.resetDelay = 0; game.freeze = null; game.stoppage = null;
        report(game, 'horn', game.period === 4 ? 'Sudden death next' : 'Intermission · Teams change ends');
      }
      return;
    }
  }
  if (game.freeze) {
    const keeper = game.players[game.freeze.keeper];
    for (const opponent of game.players) {
      if (opponent.side === keeper.side || opponent.goalie || distance(opponent,keeper) >= 1.524) continue;
      opponent.z += attackDirection(game, keeper.side) * dt * 3.6;
    }
    game.freeze.left = Math.max(0, game.freeze.left - dt);
    if (!game.freeze.left) {
      game.freeze = null; keeper.action = null;
      const outlet = game.players[keeper.side * 3];
      release(game, keeper, {kind:'pass',target:{x:outlet.x,z:outlet.z,id:outlet.id}});
      game.message = keeper.name + ' rolls the ball out';
    }
    return;
  }
  if (game.stoppage) {
    const call = game.stoppage;
    call.left -= dt;
    if (call.left <= 0) {
      game.stoppage = null;
      const runner = game.players.slice(call.side * 3, call.side * 3 + 2).sort((a,b)=>distance(a,game.ball)-distance(b,game.ball))[0];
      claim(game, runner, game.teams[call.side] + ' restart');
    }
    return;
  }
  if (game.resetDelay > 0) {
    game.resetDelay = Math.max(0, game.resetDelay - dt);
    if (game.resetDelay === 0) faceoff(game, game.restartSide);
    return;
  }
  if (game.demo) game.remaining = Math.max(0, game.remaining - dt * clockRate);
  game.cooldown = Math.max(0, game.cooldown - dt);
  game.stealShield = Math.max(0, game.stealShield - dt);
  game.sincePossession += dt;
  for (const player of game.players) {
    const index = game.controls.indexOf(player.id);
    if (index === -1) bot(game, player, dt);
    else {
      const input = inputs[index] ?? {};
      skate(game, player, input.x || 0, input.z || 0, input.standing, dt);
    }
    if (game.stoppage) return;
    if (player.action) {
      player.action.remaining -= dt;
      if (player.action.remaining <= 0) {
        release(game, player, player.action);
        player.action = null;
      }
    }
  }
  updateBall(game, dt);
}
