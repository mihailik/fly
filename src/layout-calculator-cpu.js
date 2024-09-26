// @ts-check

var gravity = 0.0001;
var repulsionForce = 0.00002;
var attractionForce = 4;
var maxIterations = 2;


/**
 * @param {{
 *  nodes: import('./layout-calculator').LayoutNode[],
 *  edges: [source: import('./layout-calculator').LayoutNode, target: import('./layout-calculator').LayoutNode][]
 * }} _
 */
export function layoutCalculatorCpu({ nodes, edges }) {
  // Initialize positions and velocities
  // nodes.forEach(node => {
  //   node.x = Math.random() * width;
  //   node.y = Math.random() * height;
  //   node.vx = 0;
  //   node.vy = 0;
  // });

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Calculate repulsion forces
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      const gravityX = nodeA.x > 0 ? -gravity : gravity;
      const gravityY = nodeA.y > 0 ? -gravity : gravity;
      nodeA.vx = (nodeA.vx || 0) + gravityX;
      nodeA.vy = (nodeA.vy || 0) + gravityY;

      for (let j = 0; j < nodes.length; j++) {
        if (i !== j) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distance = Math.sqrt(dx * dx + dy * dy) + 0.01; // Avoid division by zero
          const force = repulsionForce / (distance * distance);

          nodeA.vx = (nodeA.vx || 0) + (dx / distance) * force;
          nodeA.vy = (nodeA.vy || 0) + (dy / distance) * force;
        }
      }
    }

    // Calculate attraction forces
    for (let k = 0; k < edges.length; k++) {
      const [source, target] = edges[k];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) + 0.01; // Avoid division by zero
      const force = attractionForce * distance;

      source.vx = (source.vx || 0) + (dx / distance) * force;
      source.vy = (source.vy || 0) + (dy / distance) * force;
      target.vx = (target.vx || 0) - (dx / distance) * force;
      target.vy = (target.vy || 0) - (dy / distance) * force;
    }

    // Update positions
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.x += node.vx || 0;
      node.y += node.vy || 0;

      // Damping to stabilize the layout
      node.vx = (node.vx || 0) * 0.9;
      node.vy = (node.vy || 0) * 0.9;
    }
  }
}