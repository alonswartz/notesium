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
    .classed("link", true)
    .attr("stroke", "currentColor")
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 2)
    .attr("nid", d => d.id)
    .classed("node", true)
    .classed("node-oneword", d => (d.title.split(" ").length == 1))
    .classed("node-dangling", d => (d.title === 'dangling link'))
    .classed("node-ghost", d => (d.type === 'ghost'))
    .call(drag(simulation));

  const title = node.append("title")
    .text(d => (d.type === "ghost" ? "ghost: " + d.title : d.id + ": " + d.title));

  const label = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append('a')
    .attr("href", node => (node.type === 'ghost' ? 'javascript: void(0)' : 'javascript: getNote("' + node.id + '")'))
    .append("text")
    .classed("label", true)
    .attr("alignment-baseline", "middle")
    .text(node => (node.title == 'dangling link') ? '' : node.title);

  const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', function(event) {
    svg.selectAll('g').attr('transform', event.transform);
    if (d3.select("#forcegraph-scale-labels").property("checked")) {
      scaleLabels(event);
    }
  });
  svg.call(zoom);

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

  // emphasize or de-emphasize nodes and their links and labels
  var emphasizeNodesArr = [];
  function emphasizeNodes() {
    if (emphasizeNodesArr.length > 0) {
      const _linkedIds = data.links.filter(l => emphasizeNodesArr.includes(l.source) || emphasizeNodesArr.includes(l.target));
      const linkedIds = Array.from(new Set(_linkedIds.flatMap(l => [l.source, l.target])));
      node.attr("fill-opacity", 0.1);
      node.filter(n => linkedIds.includes(n.id)).attr("fill-opacity", 0.3)
      node.filter(n => emphasizeNodesArr.includes(n.id)).attr("fill-opacity", 1)
      label.attr("fill-opacity", 0.3).attr("font-weight", "normal");
      label.filter(l => linkedIds.includes(l.id)).attr("fill-opacity", 1)
      label.filter(l => emphasizeNodesArr.includes(l.id)).attr("fill-opacity", 1).attr("font-weight", "bold")
      link.attr("stroke", "currentColor").attr("stroke-opacity", 0.3);
      link.filter(l => emphasizeNodesArr.includes(l.source.id) || emphasizeNodesArr.includes(l.target.id)).attr("stroke-opacity", 1);
    } else {
      node.attr("fill-opacity", 1)
      label.attr("fill-opacity", 1).attr("font-weight", "normal");
      link.attr("stroke", "currentColor").attr("stroke-opacity", 1);
    }
  };

  // emphasize or de-emphasize when nodes are clicked
  node.on("click", function(event) {
    const nid = event.target.attributes.nid.value;
    emphasizeNodesArr.includes(nid) ?
      emphasizeNodesArr.splice(emphasizeNodesArr.indexOf(nid), 1) :
      emphasizeNodesArr.push(nid);
    emphasizeNodes();
  });

  // filter: filtered list
  function filteredList(results) {
    const resultsDom = d3.select("#forcegraph-filter-results");
    const resultsSorted = results.sort((a, b) => a.title.localeCompare(b.title));
    const searchWords = d3.select("#forcegraph-filter").node().value.toLowerCase().split(" ").filter(n => n.replace(/\W/g, ''));
    const searchExp = new RegExp(`(${searchWords.join('|')})`, 'ig');
    resultsDom.html("");
    resultsSorted.forEach(n => {
      var title = n.title.replace(searchExp, '<b>$1</b>');
      var href = n.type === 'ghost' ? 'javascript: void(0)' : 'javascript: getNote("' + n.id + '")';
      resultsDom.append("li").append("a").attr("href", href).html(title)
    });
  }

  // filter: search node titles word-wise
  function searchNodes(searchStr) {
    const searchWords = searchStr.toLowerCase().split(" ");
    return data.nodes.filter(n => {
      return searchWords.every(searchWord =>
        n.title.toLowerCase().includes(searchWord)
      );
    });
  }

  // filter: list and graph emphasis when node titles match
  d3.select('#forcegraph-filter').on('keyup change', function() {
    if (this.value) {
      const results = searchNodes(this.value);
      filteredList(results);
      emphasizeNodesArr = [...results.map(n => n.id)];
      emphasizeNodes();
    } else {
      filteredList([]);
      emphasizeNodesArr.splice(0);
      emphasizeNodes();
    }
  });

  // dynamic circle radius based on links count
  d3.select("#forcegraph-dynamic-radius").on("change", function() {
    if (this.checked) {
      node.attr("r", (d) => data.links.reduce((i, l) => (l.source === d.id || l.target === d.id) ? i + 0.1 : i, 1));
    } else {
      node.attr("r", 2);
    }
  });

  // toggle labels
  d3.select("#forcegraph-labels").on("change", function() {
    svg.selectAll('.label').classed("hidden", !this.checked);
  });

  // scale labels
  d3.select("#forcegraph-scale-labels").on("change", scaleLabels);
  function scaleLabels(event) {
    let k = 1;
    let labelSize = 5;
    switch (event.type) {
      case "zoom":
        k = event.transform.k;
        break;
      case "change":
        if (event.target.checked) k = d3.zoomTransform(svg.node()).k;
        break;
    }
    labelSize = k > 0.9 ? labelSize - k : 0;
    svg.selectAll('.label').transition().style("font-size", labelSize + "px");
  }

  // repel force strength
  d3.select("#forcegraph-force-strength").on("change", function() {
    d3.select("#forcegraph-force-strength-value").text(this.value);
    simulation.force("charge", d3.forceManyBody().strength(this.value));
    simulation.alpha(1).restart();
  });

  // collide radius
  d3.select("#forcegraph-collide-radius").on("change", function() {
    d3.select("#forcegraph-collide-radius-value").text(this.value);
    simulation.force("collide").radius(this.value);
    simulation.alpha(1).restart();
  });

  // collide strength
  d3.select("#forcegraph-collide-strength").on("change", function() {
    d3.select("#forcegraph-collide-strength-value").text(this.value);
    simulation.force("collide").strength(this.value);
    simulation.alpha(1).restart();
  });

  // trigger settings consistency upon initialization
  d3.select('#forcegraph-filter').dispatch("change");
  d3.select("#forcegraph-dynamic-radius").dispatch("change");
  d3.select("#forcegraph-labels").dispatch("change");
  d3.select("#forcegraph-scale-labels").dispatch("change");
  d3.select("#forcegraph-force-strength").dispatch("change");
  d3.select("#forcegraph-collide-radius").dispatch("change");
  d3.select("#forcegraph-collide-strength").dispatch("change");

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
