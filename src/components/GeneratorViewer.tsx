import * as React from "react";
import * as d3 from "d3";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { SimulationNode, SimulationLink } from './Form'
import './GeneratorViewer.css';
interface propsviewer {
  newNodes: SimulationNode[];
  newLinks: SimulationLink[];
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
  frame!: HTMLDivElement;
  frameCount = 0
  taille = 800;
  nodeRadius = 10;
  mouseX = 0;
  mouseY = 0;
  /* Quad tree structure
  tree =  d3.quadtree<SimulationNode>();
  if(this.props.nodes.length > 0) {
    this.tree
    .x((d)=>d.x??0)
    .y((d)=>d.y??0)
    .addAll(this.props.nodes);
  }*/
  // Define forcefield 
  simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(this.taille / 2).strength(0.02))
    .force("y", d3.forceY(this.taille / 2).strength(0.02))
    .force("link", d3.forceLink()
      .id(function (d: any) { return d.id; })
      .distance(this.nodeRadius * 2)
    )

  //https://reactjs.org/docs/react-component.html#componentdidupdate

  componentDidMount() {

    const isSVGCircleElement = (targetElement: any): targetElement is SVGCircleElement =>
      targetElement.classList.contains("nodes");

    this.drawSGV();
    /*bindCircleShiftClick*/
    this.frame.addEventListener('click', (ev: MouseEvent) => {
      if (!ev.shiftKey) return;
      if (!isSVGCircleElement(ev.target)) return;
      console.log("Circle+shiftClick");
      ev.target.classList.toggle('onfocus');
    });

  }
  componentDidUpdate() {
    //console.log(this.props.nodes);
    // remove old svg
    //d3.selectAll("g").remove();
    // show the new graph
    this.mayUpdateSVG();
  }

  handleKey = (e: KeyboardEvent) => {
    console.log("handling key")
    console.log(e.code);
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

  drawSGV = () => {
    console.log("###DRAW");
    d3.select(this.ref)
      .attr("style", "outline: thin solid grey;")
      .attr("width", this.taille)
      .attr("height", this.taille)
      .each((d) => console.log("Dessiné"))
      .on("mousemove", (e)=>{
        [this.mouseX, this.mouseY] = d3.pointer(e);
      });
  }




  // Define graph property
  mayUpdateSVG = () => {
    console.log("Updating SVG ????");
    const mnode = this.props.rmnode,
      rmlink = this.props.rmlink,
      addlink = this.props.addlink;

    if (!this.props.newLinks.length &&
      !this.props.newNodes.length
    ) {
      console.log("Nothing to update")
      return;
    }
    const context = d3.select(this.ref);
    // Check that componentDidUpdate did not fire for stg else than node/link-related props
    // remove props implementation may require some work
    const node = context.selectAll("circle.nodes")
      .data(this.props.newNodes, (d: any) => d.id)
      .enter();
    const link = context.selectAll("line.links")
      .data(this.props.newLinks, (d: any) => d.source.id + "-" + d.target.id)
      .enter();
    if(node.size() === 0 && link.size() === 0) return;

    console.log(`Adding ${node.size()} nodes to SVG`);
    
    // Define link with enter and the props link
    const newNodesID = new Set();
    link.append("line")
      .attr("class", "links")
      .attr("stroke", "grey")
      .attr("stroke-width", 6)
      .attr("opacity", 0.5)
      .attr("stroke-linecap", "round")
      .attr("source", function (d: any) { newNodesID.add(d.source.id);return d.source.id })
      .attr("target", function (d: any) { newNodesID.add(d.target.id);return d.target.id })
      .on("click", function (e: EventTarget, d: SimulationLink) { rmlink(d) });

    if (node.size() === 0) {
      // Not Cost efficient
      context.selectAll<SVGCircleElement, SimulationNode>('circle.nodes')
        .filter( (d:SimulationNode) => newNodesID.has(d.id))
        .raise();
    }
   
  // Define entering nodes     
    node.append('circle')
      .attr("class", "nodes")
      .attr("r", this.nodeRadius)
      .attr("fill", function (d: SimulationNode) { return hashStringToColor(d.resname) })
      .attr('stroke', "grey")
      .attr("stroke-width", "2")
      .attr("id", function (d: SimulationNode) { return d.id })
      .call(d3.drag<SVGCircleElement, SimulationNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
      .on('click', function (e: any, d: SimulationNode) {
        if (e.ctrlKey) {
          //In case of multiple selection
        }
        else {
          //remove node from json
          //rmnode(d.id);
        }
      });

    // Add a title to each node with his name and his id
    node.append("title")
      .text(function (d: SimulationNode) {
        let title = d.resname + " : " + d.id;
        return title;
      });

    const snodes: SimulationNode[] = []
    context.selectAll("circle.nodes").each((d: any) => snodes.push(d))
    const slinks: SimulationLink[] = [];
    context.selectAll("line.links").each((d: any) => slinks.push(d))
    console.log(`Updated number of nodes is ${snodes.length}`);
    // Define drag behaviour  
    const self = this;
    type dragEvent = d3.D3DragEvent<SVGCircleElement, SimulationNode, any>;
    function dragstarted(event: dragEvent, d: SimulationNode) {
      if (event.sourceEvent.shiftKey) {
        console.log("Shift key is pressed/ skipping dragstarted!");
        return;
      }
      console.log("je suis drag debut")
      console.log(d);
      console.log(event);
    }

    const clamp = (x: number, lo: number, hi: number) => {
      return x < lo ? lo : x > hi ? hi : x;
    }

    function dragged(event: dragEvent, d: SimulationNode) {
      if (event.sourceEvent.shiftKey) {
        console.log("Shift key is pressed/ skipping dragged!");
        return;
      }

      d.fx = clamp(event.x, 0, self.taille);
      d.fy = clamp(event.y, 0, self.taille);
      self.simulation.alphaDecay(.0005)
        .velocityDecay(0.6)
        .alpha(0.1).restart();

    }

    function dragended(event: dragEvent, d: SimulationNode) {
      if (event.sourceEvent.shiftKey) {
        console.log("Shift key is pressed skipping dragended!");
        return;
      }
      console.log("je suis drag fini")

      // Comment below for sticky node
      d.fx = null;
      d.fy = null;

      const closest = incontact(d)
      console.log("##closest is ")
      console.log(closest)
      console.log("##dragged is ")
      console.log(d)

      if (closest)
        addlink(d, closest);


      self.simulation.velocityDecay(0.3)
        .alphaDecay(0.0228/*1 - Math.pow(0.001, 1 / self.simulation.alphaMin())*/)
        .alpha(1)
        .alphaTarget(0)
        .restart();
    }

    // Add function to detect contact between nodes and create link
    const incontact = (c: SimulationNode): SimulationNode | null => {
      let closest: [number, SimulationNode | null] = [this.nodeRadius * 3, null];
      self.simulation.nodes().forEach((d) => {
        if (d.id === c.id) return;
        const dist = Math.sqrt( ((c.x ?? 0) - (d.x ?? 0)) * ((c.x ?? 0) - (d.x ?? 0))
                              + ((c.y ?? 0) - (d.y ?? 0)) * ((c.y ?? 0) - (d.y ?? 0))
          );
          console.log('[DRAG]cx, cy :', c.x, c.y, '|| [NEIGH] d.x, d.y', d.x, d.y, ' =>D:', dist);
        if (dist < closest[0]) closest = [dist, d];
      });
      return closest[1]
    };
    // Define ticked with coords 
    function ticked() {
      self.frameCount++;
      // console.log(`Tick num ${self.frameCount} alpha:${self.simulation.alpha()} alpha_min:${self.simulation.alphaMin()} alpha_decay:${self.simulation.alphaDecay()}`);
      console.log("Tick");
      context.selectAll("line.links")
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

      context.selectAll("circle.nodes")
        .attr("cx", function (d: any) {
          return d.x;
        })
        .attr("cy", function (d: any) {
          return d.y;
        });
    }
    console.log("STOP/RESUME SIMULATION");
    this.simulation.stop()
    this.simulation.nodes(snodes)
      .force<d3.ForceLink<SimulationNode, SimulationLink>>("link")?.links(slinks);
    this.simulation
      .on("tick", ticked)
      .alpha(1)
      .alphaTarget(0)
      .velocityDecay(0.3)
      .restart();


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
    const pasteSelectedNode = (e:React.MouseEvent) => {
      console.log("OLE!!!!")
      const [x, y] = [this.mouseX, this.mouseY]; // Target translation point
      const ghostNodes: Record<string, string|number>[] = [];
      d3.select(this.ref).selectAll<SVGCircleElement, SimulationNode>('circle.onfocus')
        .each((d: SimulationNode) => {
          ghostNodes.push({
            x: d.x ?? 0,
            y: d.y ?? 0,
            gid: d.id
          })
        });
      const [x0, y0] = ghostNodes.reduce<[number,number]>((previousValue, currentDatum, i, arr)=> {
        const _x = previousValue[0] + (currentDatum.x as number);
        const _y = previousValue[1] + (currentDatum.y as number);
        return i === arr.length - 1 ? [_x/arr.length, _y/arr.length] : [_x, _y];
      }, [0, 0])

      console.log("Selection barycenter is " + x0, y0);
      console.log("Mouse pointer is " + x, y);
      
      const [tx, ty] = [x - x0, y - y0];

      console.log("Transalation V  is " + tx, ty);
      
      //Bof 
      d3.select(this.ref).selectAll('g.ghostSel').remove();
      const gSel = d3.select(this.ref).append('g').attr('class', 'ghostSel');
      gSel.selectAll('.ghostNode').data(ghostNodes).enter().append("circle")
                                   .attr('class', 'ghostNode')
                                   .attr('cx', (d)=> (d.x as number) + tx )
                                   .attr('cy', (d)=> (d.y as number) + ty)
                                   .style("fill", "gray")
                                   .attr("r", this.nodeRadius);
      this.handleClose();
    };
    const ifSelectedNode = () => {
      const _ = d3.select(this.ref).selectAll('circle.onfocus').size();
      if (_ > 0) {
        return <MenuItem onClick={(e)=> { pasteSelectedNode(e)}}> Paste {_} selected nodes</MenuItem>;
      } else {
        return null;
      }
    }
    return (
      <div className="svg"
        onContextMenu={this.handleContextMenu}
        style={{ cursor: 'context-menu' }}
        ref={(ref: HTMLDivElement) => this.frame = ref}
      >
        <svg className="container" id="svg" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>

        <Menu
          open={this.state.show === true}
          onClose={this.handleClose}
          anchorReference="anchorPosition"
          anchorPosition={{ top: this.state.y + 2, left: this.state.x + 2 }} >
          {ifnode()}
          {ifSelectedNode()}
          <MenuItem onClick={this.handleClose}>Smart feature 2</MenuItem>
          <MenuItem onClick={this.handleClose}>Super feature</MenuItem>
          <MenuItem onClick={this.handleClose}>Awesome feature</MenuItem>
          <MenuItem onClick={this.handleClose}>Super mega idea</MenuItem>
        </Menu>

      </div>);
  }

}