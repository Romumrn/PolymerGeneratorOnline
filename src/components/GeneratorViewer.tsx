import * as React from "react";
import * as d3 from "d3";

type node = {
  resname: string,
  seqid: 0,
  id: number,
}

type link = {
  source: node,
  target: node
}

interface stateviewer {
  nodes: node[];
  links: link[];
}

interface propsviewer {
  nodes: node[];
  links: link[];
  rmnode: (id: any) => void,
  rmlink: (link :any) => void
}

function hashStringToColor(str: string) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
  }
  var r = (hash & 0xFF0000) >> 16;
  var g = (hash & 0x00FF00) >> 8;
  var b = hash & 0x0000FF;
  return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
};


export default class GeneratorViewer extends React.Component<propsviewer, stateviewer> {
  ref!: SVGSVGElement;

  //https://reactjs.org/docs/react-component.html#componentdidupdate

  componentDidMount() {
    // activate
    this.chart();
  }

  componentDidUpdate() {
    // remove old svg node
    d3.selectAll("g").remove();
    // show the new graph
    this.chart();
  }

  chart = () => {
    const taille = 800,
      radius = 10,
      rmnode = this.props.rmnode,
      rmlink = this.props.rmlink;

    const context: any = d3.select(this.ref)
      .attr("style", "outline: thin solid grey;")
      .attr("width", taille)
      .attr("height", taille);

    const simulation: any = d3.forceSimulation()
      .force("link", d3.forceLink().distance(radius*2))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX(taille/2).strength(0.02))
      .force("y", d3.forceY(taille/2).strength(0.02))

    var link = context.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.props.links)
      .enter()
      .append("line")
      .attr("stroke", "grey")
      .attr("stroke-width", 6)
      .attr("opacity", 0.5)
      .attr("stroke-linecap", "round")
      .attr("source" , function (d : any) {return d.source.id})
      .attr("target" , function (d : any) {return d.target.id})
      .on("click", function (d : any) { rmlink( d ) });

    const node = context.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(this.props.nodes)
      .enter()
      .append('circle')
      .attr("r", radius)
      .attr("fill", function (d: node) { return hashStringToColor(d.resname) })
      .attr('stroke', "grey")
      .attr("stroke-width", "2")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on('click', function (e :any, d : node) {
          if (e.ctrlKey) {
            // d3.select(this.)
            //   .attr('stroke', "black")
            //   .attr("class", "ctrltrue");
          }
          else {
            //remove node from json
            console.log(d.id);
            rmnode(d.id);
          }
        });


    node.append("title")
      .text(function (d: node) {
        let title = d.resname+" : "+d.id;
        return title;
      });

    simulation.nodes(this.props.nodes).on("tick", ticked);
    simulation.force("link").links(this.props.links);

    function dragstarted(event: any, d: any) {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }

    function ticked() {
      link
        .attr("x1", function (d: any) {
          return d.source.x;
        })
        .attr("y1", function (d: any) {
          return d.source.y;
        })
        .attr("x2", function (d: any) {
          return d.target.x;
        })
        .attr("y2", function (d: any) {
          return d.target.y;
        });

      node
        .attr("cx", function (d: any) {
          return d.x;
        })
        .attr("cy", function (d: any) {
          return d.y;
        });
    }
  }

  render() {
    return (
    <div className="svg">
      <svg className="container" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>
    </div>);
  }
}