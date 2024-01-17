var t = `
<div class="forcegraph h-full w-full overflow-hidden text-gray-200" ref="forcegraph"></div>
`

export default {
  props: ['graphData', 'emphasizeNodes'],
  emits: ['title-click'],
  methods: {
    initGraph() {
      const vm = this;
      vm.$refs.forcegraph.innerHTML = "";

      const links = this.graphData.links.map(d => Object.create(d));
      const nodes = this.graphData.nodes.map(d => Object.create(d));

      const svg = d3.select(vm.$refs.forcegraph).append("svg")
        .style("height", "inherit")
        .style("width", "inherit")
        .attr("viewBox", [-140, -180, 320, 360]);

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
        .classed("node", true)
        .call(drag(simulation));

      const title = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("text")
        .classed("title", true)
        .on("click", function(event, node) { vm.$emit('title-click', node.id); })
        .text(node => node.title);

      const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', function(event) {
        svg.selectAll('g').attr('transform', event.transform);
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
        title
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

      vm.$watch('emphasizeNodes', function(nodeIds) {
        if (nodeIds && nodeIds.length > 0) {
          const linkedNodeIds = Array.from(new Set(vm.graphData.links
            .filter(l => nodeIds.includes(l.source) || nodeIds.includes(l.target))
            .flatMap(l => [l.source, l.target])));

          node.attr("fill-opacity", 0.1);
          title.attr("fill-opacity", 0.3).attr("font-weight", "normal");
          link.attr("stroke", "currentColor").attr("stroke-opacity", 0.3);

          node.filter(n => linkedNodeIds.includes(n.id)).attr("fill-opacity", 0.3);
          title.filter(t => linkedNodeIds.includes(t.id)).attr("fill-opacity", 1);

          node.filter(n => nodeIds.includes(n.id)).attr("fill-opacity", 1);
          title.filter(t => nodeIds.includes(t.id)).attr("fill-opacity", 1).attr("font-weight", "bold");
          link.filter(l => nodeIds.includes(l.source.id) || nodeIds.includes(l.target.id)).attr("stroke-opacity", 1);

        } else {
          node.attr("fill-opacity", 1)
          title.attr("fill-opacity", 1).attr("font-weight", "normal");
          link.attr("stroke", "currentColor").attr("stroke-opacity", 1);
        }
      });

    },
  },
  mounted() {
    this.initGraph();
  },
  template: t
}
