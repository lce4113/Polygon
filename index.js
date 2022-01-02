const gridWidth = 2
const gridHeight = 2
let gridDist, radius;

const dots = []
const lines = []
const currLine = { show: false }
let redMove = true
const polygons = []
let areaLeft = (gridWidth - 1) * (gridHeight - 1);
let red = 0, blue = 0;

let xOffset, yOffset, posToX, posToY, positionScore;
posToX = i => xOffset + gridDist * i;
posToY = k => yOffset + gridDist * k;

let scoreboard, redScoreboard, blueScoreboard;

function setup() {
  createCanvas(windowWidth, windowHeight);

  scoreboard = document.getElementById('scoreboard');
  redScoreboard = document.getElementById('red-score');
  blueScoreboard = document.getElementById('blue-score');

  // position things
  rePos = () => {
    // set offsets
    gridDist = Math.min(width / (gridWidth + 2), height / (gridHeight + 2));
    xOffset = (width - gridDist * (gridWidth - 1)) / 2;
    yOffset = (height - gridDist * (gridHeight - 1)) / 2;

    // position scoreboard
    scoreboard.style.fontSize = `${gridDist * 0.4}px`;
    scoreboard.style.left = (width - document.getElementById('scoreboard').offsetWidth) / 2 + 'px';
    scoreboard.style.top = (yOffset - document.getElementById('scoreboard').offsetHeight) / 2 + 'px';
  }
  rePos();

  // create all dots
  for (let i = 0; i < gridWidth; i++) {
    dots[i] = []
    for (let k = 0; k < gridHeight; k++) {
      dots[i][k] = { x: i, y: k };
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rePos();
}

// get distance between two points
const dist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

function draw() {
  background(51);

  // draw all polygons
  noStroke();
  for (const polygon of polygons) {
    const x = polygon.edges.map(e => e.x1).reduce((a, b) => a + b) / polygon.edges.length;
    const y = polygon.edges.map(e => e.y1).reduce((a, b) => a + b) / polygon.edges.length;
    if (polygon.opacity < 255) polygon.opacity += 10;
    fill(...(polygon.red ? [255, 175, 175] : [175, 175, 255]), polygon.opacity);
    beginShape(); // draw polygon
    for (const edge of polygon.edges) {
      vertex(posToX(edge.x1), posToY(edge.y1));
    }
    vertex(posToX(polygon.edges[0].x1), posToY(polygon.edges[0].y1));
    endShape();
  }

  // draw current line
  strokeWeight(gridDist * 0.05);
  if (currLine.show) {
    stroke(...(redMove ? [150, 59, 59] : [74, 74, 150]));
    line(posToX(currLine.x1), posToY(currLine.y1), mouseX, mouseY);
  }

  // draw all lines
  for (const l of lines) {
    stroke(...(l.red ? [255, 100, 100] : [125, 125, 255]));
    line(posToX(l.x1), posToY(l.y1), posToX(l.x2), posToY(l.y2));
  }

  // draw dots
  noStroke();
  radius = gridDist * 0.15;
  for (const row of dots) {
    for (const dot of row) {
      dot.hover = dist(posToX(dot.x), posToY(dot.y), mouseX, mouseY) <= radius;
      fill(dot.hover || dot.selected ? 150 : 255);
      circle(posToX(dot.x), posToY(dot.y), radius);
    }
  }

  // draw end of game message
  if (eq(areaLeft, 0)) {
  }
}

// find area of triangle
const area = triangle => {
  const x1 = triangle.edges[0].x1, y1 = triangle.edges[0].y1;
  const x2 = triangle.edges[1].x1, y2 = triangle.edges[1].y1;
  const x3 = triangle.edges[2].x1, y3 = triangle.edges[2].y1;
  return Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2;
}
// round to n decimal places
const eq = (a, b) => Math.abs(a - b) < 0.00001;
// check if line intersects any other line
const intersects = l1 => lines.some(l2 => {
  const slope1 = ((l1.x2 == l1.x1) ? "INF" : (l1.y2 - l1.y1) / (l1.x2 - l1.x1));
  const slope2 = ((l2.x2 == l2.x1) ? "INF" : (l2.y2 - l2.y1) / (l2.x2 - l2.x1));
  if (slope1 === slope2) return false;
  const yint1 = l1.y1 - slope1 * l1.x1;
  const yint2 = l2.y1 - slope2 * l2.x1;
  let intx, inty;
  if (slope1 == "INF") intx = l1.x1, inty = slope2 * intx + yint2;
  else if (slope2 == "INF") intx = l2.x1, inty = slope1 * intx + yint1;
  else {
    intx = (yint2 - yint1) / (slope1 - slope2);
    inty = slope1 * intx + yint1;
  }

  return (
    Math.min(l1.y1, l1.y2) <= inty && inty <= Math.max(l1.y1, l1.y2) &&
    Math.min(l1.x1, l1.x2) <= intx && intx <= Math.max(l1.x1, l1.x2) &&
    Math.min(l2.y1, l2.y2) <= inty && inty <= Math.max(l2.y1, l2.y2) &&
    Math.min(l2.x1, l2.x2) <= intx && intx <= Math.max(l2.x1, l2.x2) &&
    !(eq(intx, l1.x1) && eq(inty, l1.y1)) && !(eq(intx, l1.x2) && eq(inty, l1.y2))
  );
});
// find gcd of two numbers
const gcd = (a, b) => {
  if (a === 0) return b;
  if (b === 0) return a;
  let gcd = 0;
  for (let i = 1; i <= a && i <= b; i++) {
    if (a % i === 0 && b % i === 0) gcd = i;
  }
  return gcd;
};
// check if a line intersects any lattice points
const through = l => gcd(Math.abs(l.x1 - l.x2), Math.abs(l.y1 - l.y2)) !== 1;
// check if two lines are equal
const lineEq = (l1, l2) => (
  (l1.x1 === l2.x1 && l1.y1 === l2.y1 && l1.x2 === l2.x2 && l1.y2 === l2.y2) ||
  (l1.x1 === l2.x2 && l1.y1 === l2.y2 && l1.x2 === l2.x1 && l1.y2 === l2.y1)
);
function mousePressed() {
  if (mouseX > width || mouseY > height) return;
  for (let x = 0; x < dots.length; x++) {
    for (let y = 0; y < dots[x].length; y++) {
      const dot = dots[x][y];

      if (dot.hover) {
        if (currLine.show) {
          currLine.show = false;
          dots[currLine.x1][currLine.y1].selected = false;
          const l = {
            x1: currLine.x1,
            y1: currLine.y1,
            x2: dot.x,
            y2: dot.y,
            red: redMove
          };
          if (through(l)) return; // check if line goes through lattice points
          if (intersects(l)) return; // check if line intersects other lines
          if (lines.some(l2 => lineEq(l, l2))) return; // check if line is already in lines
          lines.push(l);
          const newPolygons = detect(l);
          if (newPolygons.length === 0) redMove = !redMove;
          polygons.push(...newPolygons);
          for (const p of newPolygons) {
            areaLeft -= area(p);
            red += p.red, blue += !p.red;
            redScoreboard.innerText = red, blueScoreboard.innerText = blue;
          }
        } else {
          dot.selected = true;
          Object.assign(currLine, { show: true, x1: dot.x, y1: dot.y });
        }
        return;
      }
    }
  }
}

// check if two lines are colinear
const inline = (l1, l2) => (l2.x2 - l2.x1) * (l1.y2 - l1.y1) === (l1.x2 - l1.x1) * (l2.y2 - l2.y1);

// check if lattice points contained
const lattice = (edges) => {
  for (const row of dots) {
    for (const dot of row) {
      if (edges.some(e => e.x1 === dot.x && e.y1 === dot.y)) continue;
      let B = true;
      for (const edge of edges) {
        let i = 0;
        while (
          (edges[i].x1 == edge.x1 && edges[i].y1 == edge.y1) ||
          (edges[i].x1 == edge.x2 && edges[i].y1 == edge.y2)
        ) i++;
        const vertex = { x: edges[i].x1, y: edges[i].y1 };
        if (edge.x2 == edge.x1) {
          const b1 = (vertex.x > edge.x1);
          const b2 = (dot.x > edge.x1);
          if (b1 != b2) { B = false; break; }
          continue;
        }
        const slope = (edge.y2 - edge.y1) / (edge.x2 - edge.x1);
        const b1 = (vertex.y > slope * (vertex.x - edge.x1) + edge.y1);
        const b2 = (dot.y > slope * (dot.x - edge.x1) + edge.y1);
        if (b1 != b2) { B = false; break; }
      }
      if (B) return true;
    }
  }
  return false;
}

// detect all polygons
const detect = l => detectRec([{ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }]);
// recursive function to detect all polygons
function detectRec(edges) {
  if (edges.length > 3) return [];
  const start = edges[0];
  const end = edges.at(-1);
  if (end.x2 === start.x1 && end.y2 === start.y1) {
    if (lattice(edges)) return []; // no lattice points contained
    return [{ edges, red: redMove, opacity: 0 }];
  }

  const ans = [];
  for (const l of lines) {
    if (l.x2 === end.x2 && l.y2 === end.y2) [l.x1, l.x2] = [l.x2, l.x1], [l.y1, l.y2] = [l.y2, l.y1]; // swap
    if (l.x1 !== end.x2 || l.y1 !== end.y2) continue; // not the same line
    if (inline(end, l)) continue; // colinear
    if (edges.slice(1).some(e => e.x1 === l.x2 && e.y1 === l.y2)) continue; // already an edge
    ans.push(...detectRec([...edges, { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }]));
  }
  return ans;
}