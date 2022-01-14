import * as React from "react";
import * as d3 from "d3";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { SimulationNode, SimulationLink } from './Form'

interface propsviewer {
  nodes: SimulationNode[];
  links: SimulationLink[];
  rmnode: (id: any) => void,
  rmlink: (link: any) => void
  addlink: (link1: SimulationNode, link2: SimulationNode) => void
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

interface statecustommenu {
  x: number,
  y: number,
  isnode: string | undefined,
  show: boolean
}

export default class GeneratorViewer extends React.Component<propsviewer, statecustommenu> {


  // Ajouter un point d'exclamation veut dire qu'on est sur que la valeur n'est pas nul

  ref!: SVGSVGElement;

  taille = 800;
  radius = 10;

  // Define forcefield 
  simulation =  d3.forceSimulation<SimulationNode, SimulationLink>()
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(this.taille / 2).strength(0.02))
    .force("y", d3.forceY(this.taille / 2).strength(0.02))
    .force("link", d3.forceLink()
      .id(function(d : any) { 
        console.log("DING");console.log(d);return d.id; }
      )
      .distance(this.radius * 2)
    )
    
    //https://reactjs.org/docs/react-component.html#componentdidupdate

  componentDidMount() {
    // activate
    this.chart();
  }

  componentDidUpdate() {
    //console.log(this.props.nodes);
    // remove old svg
    //d3.selectAll("g").remove();
    // show the new graph
    this.chart();
  }


  // componentDidUpdate() {
  //   // remove old svg
  //  // d3.selectAll("g").remove();
  //   // show the new graph
  //  // this.chart();
  //  const svg = d3.select(this.ref);
  //  const nodes = svg.selectAll("g.nodes").data( this.props.nodes);
  //  nodes.enter()
  // }



  // // Define graph property
  // chart = () => {
  //   const taille = 800,
  //     radius = 10,
  //     rmnode = this.props.rmnode,
  //     rmlink = this.props.rmlink,
  //     addlink = this.props.addlink;


  // Define graph property
  chart = () => {
    const taille = 800,
      radius = 10,
      rmnode = this.props.rmnode,
      rmlink = this.props.rmlink,
      addlink = this.props.addlink;

    // Define svg box
    const context: any = d3.select(this.ref)
      .attr("style", "outline: thin solid grey;")
      .attr("width", taille)
      .attr("height", taille);

    // Define link with enter and the props link
    var link = context.selectAll("line.links")
      .data(this.props.links, (d: any) => d.source.id + "-" + d.target.id)
      .enter()
      .append("line")
      .attr("class", "links")
      .attr("stroke", "grey")
      .attr("stroke-width", 6)
      .attr("opacity", 0.5)
      .attr("stroke-linecap", "round")
      .attr("source", function (d: any) { return d.source.id })
      .attr("target", function (d: any) { return d.target.id })
      .on("click", function (e: EventTarget, d: SimulationLink) { rmlink(d) });

    // Define node with enter and props nodes
    const node = context.selectAll("circle.nodes")
      .data(this.props.nodes, (d: any) => d.id)
      .enter()
      .append('circle')
      .attr("class", "nodes")
      .attr("r", radius)
      .attr("fill", function (d: SimulationNode) { return hashStringToColor(d.resname) })
      .attr('stroke', "grey")
      .attr("stroke-width", "2")
      .attr("id", function (d: SimulationNode) { return d.id })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on('click', function (e: any, d: SimulationNode) {
        if (e.ctrlKey) {
          //In case of multiple selection
        }
        else {
          //remove node from json
          rmnode(d.id);
        }
      });

    // Add a title to each node with his name and his id
    node.append("title")
      .text(function (d: SimulationNode) {
        let title = d.resname + " : " + d.id;
        return title;
      });


    //const pnodes = this.simulation.nodes() ;
    //console.log( pnodes );
    const snodes = context.selectAll("circle.nodes")
    const slinks = context.selectAll("line.links")

      console.log("link");
    console.log( slinks);
    if (slinks.empty()) return 
    const _slinks =this.props.links//[ {source:"1",target:"2"} ];
    this.simulation.nodes(snodes).on("tick", ticked).velocityDecay(0.3);
    this.simulation.force<d3.ForceLink<SimulationNode, SimulationLink>>("link")?.links(_slinks);


    // Define drag behaviour  
      const self = this;
    function dragstarted(event: any, d: any /*SimulationNode*/  ) {
      if (!event.active) {
        self.simulation.alphaTarget(0).velocityDecay(0.9);
      }
      console.log("je suis drag" )
      console.log(d);
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d:  any /*SimulationNode*/ ) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d:  any /*SimulationNode*/ ) {
      let contact;
      if (!event.active) {
        self.simulation.alphaTarget(0).velocityDecay(0.9);
      }
      d.fx = null;
      d.fy = null;
      contact =  incontact(event.x, event.y, d.id);
      if (contact !== null) {
        addlink(d, contact)
      }
    }

    // Add function to detect contact between nodes and create link
   const incontact =  (x: number, y: number, id: number) => {
      const nodes = self.simulation.nodes();
      let n = nodes.length,
        dx,
        dy,
        dist,
        node;

      for (let i = 0; i < n; ++i) {
        node = nodes[i] as SimulationNode;
        dx = x - (node.x ? node.x : 0);
        dy = y - (node.y ? node.y : 0);
        dist = Math.sqrt(dx * dx + dy * dy);
        if ((dist < radius * 2) && (node.id !== id)) {
          return node;
        }
      }
      return null;
    };


    // Define ticked with coords 
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

  state = { x: 0, y: 0, isnode: undefined, show: false };

  handleClose = () => {
    this.setState({ show: false });
  };

  handleContextMenu = (event: React.MouseEvent) => {
    console.log(event);
    event.preventDefault();
    let nodeid = document.elementFromPoint(event.clientX, event.clientY)?.getAttribute('id');
    if (typeof (nodeid) === 'string') {
      this.setState({ x: event.clientX, y: event.clientY, isnode: nodeid, show: true });
    }
    else {
      this.setState({ x: event.clientX, y: event.clientY, show: true });
    }
  };

  render() {

    let node: any = this.state.isnode;
    const rmnodefromContextMenu = (event: React.MouseEvent) => {
      console.log(node);
      this.props.rmnode(node);
      this.handleClose();
    }

    const ifnode = () => {
      if (!isNaN(node)) {
        return <MenuItem onClick={rmnodefromContextMenu}> Remove Node {node}</MenuItem>;
      } else {
        return null;
      }
    }

    return (
      <div className="svg" onContextMenu={this.handleContextMenu} style={{ cursor: 'context-menu' }}>
        <svg className="container" id="svg" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>

        <Menu
          open={this.state.show === true}
          onClose={this.handleClose}
          anchorReference="anchorPosition"
          anchorPosition={{ top: this.state.y + 2, left: this.state.x + 2 }} >
          {ifnode()}
          <MenuItem onClick={this.handleClose}>Smart feature 1</MenuItem>
          <MenuItem onClick={this.handleClose}>Smart feature 2</MenuItem>
          <MenuItem onClick={this.handleClose}>Super feature</MenuItem>
          <MenuItem onClick={this.handleClose}>Awesome feature</MenuItem>
          <MenuItem onClick={this.handleClose}>Super mega idea</MenuItem>
        </Menu>

      </div>);
  }

}