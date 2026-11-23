export const cities = [
  ['Toronto', 'Canada', 43.653, -79.383, 'Basement Classic', 'Maple Street'],
  ['Montréal', 'Canada', 45.502, -73.567, 'Rec Centre', 'St-Laurent'],
  ['Boston', 'United States', 42.360, -71.059, 'School Gym', 'Harbor'],
  ['Detroit', 'United States', 42.332, -83.047, 'Community Hall', 'Motor City'],
  ['Winnipeg', 'Canada', 49.895, -97.138, 'Prairie Fieldhouse', 'Prairie North'],
  ['Calgary', 'Canada', 51.047, -114.063, 'Foothills Rink', 'Foothills'],
  ['Vancouver', 'Canada', 49.283, -123.121, 'Pacific Pavilion', 'Pacific'],
  ['Stockholm', 'Sweden', 59.329, 18.068, 'Island Arena', 'Archipelago'],
  ['Helsinki', 'Finland', 60.170, 24.938, 'Harbour Hall', 'North Harbour'],
  ['Prague', 'Czechia', 50.076, 14.437, 'City Championship', 'Bohemian Club'],
].map(([city, country, lat, lon, arena, team], index) => ({
  city, country, lat, lon, arena, team, id: 'city-' + index,
  coach: ['Avery', 'Camille', 'Jordan', 'Taylor', 'Rowan', 'Morgan', 'Sky', 'Alva', 'Aino', 'Robin'][index],
  tips: [
    'Pass early and move to the open lane.', 'Make the goalie move before you shoot.',
    'Follow your shot and look for a loose ball.', 'Stay between the ball and your net.',
    'Switch to your teammate to cover the far side.', 'Move off the ball to make a passing lane.',
    'Shoot across the goal when the goalie leans.', 'Keep an outlet open when your partner carries.',
    'Pressure the ball carrier while your partner covers.', 'Use both sides of the floor to spread out the defense.',
  ][index],
}));

const svgNS = 'http://www.w3.org/2000/svg';
const tileUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
export function setupTourMap({ map, caption, onSelect }) {
  let mode = 'world', city = 0, zoom = 15, paths = [];
  const setCaption = (text) => { caption.textContent = text; };
  function vector(tag, attrs) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }
  const point = ({lon, lat}) => [(lon + 180) * 2.5, (90 - lat) * 2.5];
  function worldMap() {
    const svg = vector('svg', { viewBox: '0 0 900 450', role: 'group', 'aria-label': 'World tour cities' });
    for (const path of paths) svg.append(vector('path', { d: path, class: 'map-land' }));
    svg.append(vector('polyline', { points: cities.map((stop) => point(stop).join(',')).join(' '), class: 'map-route' }));
    cities.forEach((stop, index) => {
      const [x, y] = point(stop);
      const pin = vector('circle', { cx: x, cy: y, r: 4, class: index === city ? 'map-pin current' : 'map-pin', tabindex: 0, role: 'button', 'aria-label': stop.city });
      const title = vector('title', {});
      title.textContent = stop.city;
      pin.append(title);
      pin.addEventListener('click', () => onSelect(index));
      pin.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(index); }
      });
      svg.append(pin);
    });
    map.replaceChildren(svg);
    setCaption(paths.length ? 'Land outlines by Natural Earth' : 'World tour route');
  }
  function satelliteMap() {
    const { lat, lon } = cities[city];
    const radius = 2 ** zoom, radians = lat * Math.PI / 180;
    const x = (lon + 180) / 360 * radius;
    const y = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * radius;
    const grid = document.createElement('div');
    grid.className = 'satellite-grid';
    grid.style.setProperty('--shift-x', (0.5 - (x % 1)) * 256 + 'px');
    grid.style.setProperty('--shift-y', (0.5 - (y % 1)) * 256 + 'px');
    let loaded = 0, errors = 0;
    for (let row = -1; row <= 1; row++) for (let col = -1; col <= 1; col++) {
      const tile = new Image(256, 256);
      tile.alt = '';
      tile.src = tileUrl + [zoom, Math.floor(y) + row, Math.floor(x) + col].join('/');
      tile.onload = () => { loaded++; };
      tile.onerror = () => {
        errors++;
        if (!loaded && errors === 9 && map.contains(grid)) setCaption('Satellite imagery unavailable. Switch to World map to browse cities.');
      };
      grid.append(tile);
    }
    const marker = document.createElement('span');
    marker.className = 'satellite-marker';
    marker.textContent = cities[city].city;
    map.replaceChildren(grid, marker);
    setCaption('Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community');
  }
  function render() { if (mode === 'world') worldMap(); else satelliteMap(); }
  fetch('./tour-land.json').then((response) => response.json()).then((data) => {
    paths = data;
    if (mode === 'world') render();
  }).catch(() => {});
  return {
    setCity(index) { city = index; render(); },
    setMode(value) { mode = value; render(); },
    changeZoom(delta) { zoom = Math.max(12, Math.min(18, zoom + delta)); if (mode === 'satellite') render(); },
  };
}
