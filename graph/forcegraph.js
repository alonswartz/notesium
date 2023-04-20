function initialize_forcegraph(data, graphdiv) {
  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  const svg = d3.select(graphdiv).append("svg")
    .style("height", "inherit")
    .style("width", "inherit")
    .attr("viewBox", [-160, -180, 320, 360]);

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  const link = svg.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 2)
    .attr("class", "node")
    .attr("fill-opacity", d => (d.title === 'dangling') ? 0.3 : 1)
    .call(drag(simulation));

  const title = node.append("title")
    .text(d => d.id + ": " + d.title);

  const label = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("alignment-baseline", "middle")
    .text(node => (node.title == 'dangling') ? '' : node.title);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    label
      .attr('x', d => d.x + 4).attr('y', d => d.y);
  });

  function drag(simulation) {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
}
