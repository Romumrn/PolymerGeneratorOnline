import * as React from "react";
import * as d3 from "d3";

type node = {
  resname: string,
  seqid: 0,
  id: number,
  cx: number,
  cy: number
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
  rmnode: (arg0: any) => void,
  rmlink: (id1: string, id2: string) => void

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
  constructor(props: propsviewer) {
    super(props);
  }


  ref!: SVGSVGElement;

  //https://reactjs.org/docs/react-component.html#componentdidupdate

  componentDidMount() {
    // activate
    this.buildGraph();
  }

  componentDidUpdate() {
    this.buildGraph();
  }

  buildGraph = () => {
    const taille = 800,
      radius = 20,
      rmnode = this.props.rmnode,
      rmlink = this.props.rmlink ;

    const graph = d3.select(this.ref)
      .attr("style", "outline: thin solid grey;")
      .attr("width", taille)
      .attr("height", taille);

    graph.selectAll('circle')
      .data(this.props.nodes)
      .join(
        enter => enter.append('circle')
          .attr("name", function (d) { return d.resname })
          .attr("id", function (d) { return d.id })
          .attr("cx", function (d) { return d.cx })
          .attr("cy", function (d) { return d.cy })
          .attr("r", radius)
          .attr("class", "ctrlfalse")
          .attr("fill", function (d) { return hashStringToColor(d.resname) })
          .attr('stroke', "grey")
          .attr("stroke-width", "2")

          .on('click', function (e, d) {
            if (e.ctrlKey) {
              d3.select(this)
                .attr('stroke', "black")
                .attr("class", "ctrltrue");
            }
            else {
              //remove node from json
              rmnode(d.id);
            }

          })
      )

    graph.selectAll('line')
      .data(this.props.links)
      .join("line")
      .attr("stroke", "grey")
      .attr("stroke-width", 6)
      .attr("opacity", 0.5)
      .attr("stroke-linecap", "round")
      .attr("x1", function (d) { return d.source.cx })
      .attr("y1", function (d) { return d.source.cy })
      .attr("x2", function (d) { return d.target.cx })
      .attr("y2", function (d) { return d.target.cy })
      .on("click", function (d) { rmlink(d.source, d.target)} );
  }

  render() {
    return (<div className="svg">
      <svg className="container" ref={(ref: SVGSVGElement) => this.ref = ref} width='100' height='100'></svg>
    </div>);
  }
}