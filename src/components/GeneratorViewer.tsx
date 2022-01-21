import * as React from "react";
import * as d3 from "d3";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { SimulationNode, SimulationLink } from './Form'
import './GeneratorViewer.css';
// import { SimulationLinkDatum } from "d3";


interface propsviewer {
  newNodes: SimulationNode[];
  newLinks: SimulationLink[];
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
  nodeClick: any | undefined,
  nodeToRemove: any[],
  show: boolean,
}

export default class GeneratorViewer extends React.Component<propsviewer, statecustommenu> {

  state: statecustommenu = { x: 0, y: 0, nodeClick: undefined, show: false, nodeToRemove: [] };


  // Ajouter un point d'exclamation veut dire qu'on est sur que la valeur n'est pas nul
  ref!: SVGSVGElement;
  frame!: HTMLDivElement;
  frameCount = 0
  taille = 800;
  nodeRadius = 10;
  mouseX = 0;
  mouseY = 0;
  prevPropsNewnode: any = null;
  prevPropsNewLink: any = null;

  /* Quad tree structure
  tree =  d3.quadtree<SimulationNode>();
  if(this.props.nodes.length > 0) {
    this.tree
    .x((d)=>d.x??0)
    .y((d)=>d.y??0)
    .addAll(this.props.nodes);
  }*/

  // Define simulation forcefield 
  simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(this.taille / 2).strength(0.02))
    .force("y", d3.forceY(this.taille / 2).strength(0.02))
    .force("link", d3.forceLink()
      .id(function (d: any) { return d.id; })
      .distance(this.nodeRadius * 2.5)
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
  componentDidUpdate(prevProps: propsviewer, prevStates: statecustommenu) {
    console.log("On rentre dans componentDidUpdate");
    console.log(this.props);
    console.log(this.state)
    //Check state and props 
    if ((prevProps.newNodes === this.props.newNodes) && (prevProps.newLinks === this.props.newLinks)) {
      console.log("Same props than earlier")
    }
    else this.UpdateSVG();

    if (this.state.nodeToRemove !== prevStates.nodeToRemove) {
      console.log("new state nodeToRemove");
      this.UpdateSVG()
    }
    else console.log("same state")

  }


  handleKey = (e: KeyboardEvent) => {
    console.log("handling key")
    console.log(e.code);
  }

  //Draw svg frame
  drawSGV = () => {
    console.log("Svg frame draw");
    d3.select(this.ref)
      .attr("style", "outline: thin solid grey;")
      .attr("width", this.taille)
      .attr("height", this.taille)
      // .each((d) => console.log("Dessiné"))
      .on("mousemove", (e) => {
        [this.mouseX, this.mouseY] = d3.pointer(e);
      });



    // Add brush property
    const brushed = (event: any) => {
      //Stop simulation when brush
      this.simulation.stop();
      //Get brush zone coord
      const selection: any = event.selection; //[[x0, y0], [x1, y1]],
      console.log("brush", event);
      if (selection) {
        //select all node inside brush zone 
        d3.select(this.ref).selectAll("circle")
          .filter((d: any) => ((d.x < selection[1][0]) && (d.x > selection[0][0]) && (d.y < selection[1][1]) && (d.y > selection[0][1])))
          .attr("class", "onfocus");
        //select all link inside brush zone 

        //Faire verif :
        //Si 2 noeuds sont selectionnés le lien qui les unis est selectionné par defaut 
        // d3.select(this.ref).selectAll("line")
        //   .filter((d: any) => ((d.x < selection[1][0]) && (d.x > selection[0][0]) && (d.y < selection[1][1]) && (d.y > selection[0][1])))
        //   .attr("class", "onfocus");
      }
    }

    //How to close brush zone after ?????????????????????????????
    const brushEnd = (event: any) => {
      //d3.select(this.ref).select(".brush").selectChildren().attr("style" , "display: none");
    }

    d3.select(this.ref).append("g")
      .attr("class", "brush")
      .call(d3.brush()
        .on("start brush", brushed)
        .on("end", brushEnd)
      );

  }


  // Define graph property
  UpdateSVG = () => {

    const addlink = this.props.addlink;
    const svgContext = d3.select(this.ref);

    const reloadSimulation = () => {
      console.log("Reload simulation with new svg property");

      const snodes: SimulationNode[] = []
      svgContext.selectAll("circle.nodes").each((d: any) => snodes.push(d))
      const slinks: SimulationLink[] = [];
      svgContext.selectAll("line.links").each((d: any) => slinks.push(d))

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

    //Verifier si on doit supprimer des trucs !!! 
    if (this.state.nodeToRemove.length > 0) {
      console.log("On veut supprimer ca : ", this.state.nodeToRemove);
      var nodeToRemovecopy = [...this.state.nodeToRemove];
      for (const node of nodeToRemovecopy) {
        console.log("on entre dans la boucle et on supprime ca :", node);
        svgContext.selectAll("circle").filter((d: any) => (d.id === node.id)).remove();
        //and then remove link inside svg
        svgContext.selectAll("line.links").filter((link: any) => ((link.source.id === node.id) || (link.target.id === node.id))).remove();
      }
      this.setState({ nodeToRemove: [], nodeClick: null });
      return;
    }


    const newNodesID = new Set();
    // Verifier si on doit bien ajouter des props ou si c'est deja fait 
    if (this.prevPropsNewLink !== this.props.newLinks) {
      const link = svgContext.selectAll("line.links")
        .data(this.props.newLinks, (d: any) => d.source.id + "-" + d.target.id)
        .enter();

      link.append("line")
        .attr("class", "links")
        .attr("stroke", "grey")
        .attr("stroke-width", 6)
        .attr("opacity", 0.5)
        .attr("stroke-linecap", "round")
        .attr("source", function (d: any) { newNodesID.add(d.source.id); return d.source.id })
        .attr("target", function (d: any) { newNodesID.add(d.target.id); return d.target.id })
        .on("click", function (this: any, e: EventTarget, d: SimulationLink) {
          //Si on click dessus ca supprime le lien 
          //Fonction supprimé pour le moment
          //removeThisLink(this)
        });
    }


    // Si des news props apparaissent on ajoute les noeuds !!!
    if (this.prevPropsNewnode !== this.props.newNodes) {
      const node = svgContext.selectAll("circle.nodes")
        .data(this.props.newNodes, (d: any) => d.id)
        .enter();

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
        .on('click', function (this: any, e: any, d: SimulationNode) {
          if (e.ctrlKey) return
          else if (e.shiftKey) return;
          //Si on click sur le lien il est supprimé 
          else /*removeThisNode(this)*/;
        });

      // Add a title to each node with his name and his id
      node.append("title")
        .text(function (d: SimulationNode) {
          let title = d.resname + " : " + d.id;
          return title;
        })
    }

    //Keep the previous props in memory
    this.prevPropsNewLink = this.props.newLinks;
    this.prevPropsNewnode = this.props.newNodes;

    //Fait apparaitre tous les noeuds au dessus 
    svgContext.selectAll<SVGCircleElement, SimulationNode>('circle.nodes')
      .filter((d: SimulationNode) => newNodesID.has(d.id))
      .raise();


    // Define drag behaviour  
    const self = this;
    type dragEvent = d3.D3DragEvent<SVGCircleElement, SimulationNode, any>;
    function dragstarted(event: dragEvent, d: SimulationNode) {
      if (event.sourceEvent.shiftKey) {
        console.log("Shift key is pressed/ skipping dragstarted!");
        return;
      }
      console.log("- je bouge - ", d.id)
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
      // Comment below for sticky node
      d.fx = null;
      d.fy = null;

      const closest = incontact(d)
      if (closest)
        addlink(d, closest);

      self.simulation.velocityDecay(0.3)
        .alphaDecay(0.0228/*1 - Math.pow(0.001, 1 / self.simulation.alphaMin())*/)
        .alpha(1)
        .alphaTarget(0)
        .restart();
    }

    // function removeThisNode(svgNode: any) {
    //   //remove the node directly in the svg 
    //   svgNode.remove();
    //   //and then remove link inside svg
    //   svgContext.selectAll("line.links").filter((link: any) => ((link.source.id === svgNode.id) || (link.target.id === svgNode.id))).remove();
    //   reloadSimulation()
    // }

    // function removeThisLink(svgLink: any) {
    //   //remove the link directly in the svg 
    //   svgLink.remove();
    //   // reattribute 
    //   reloadSimulation()
    // }

    //Add function to detect contact between nodes and create link
    const incontact = (c: SimulationNode): SimulationNode | null => {
      let closest: [number, SimulationNode | null] = [this.nodeRadius * 2.2, null];
      self.simulation.nodes().forEach((d) => {
        if (d.id === c.id) return;
        const dist = Math.sqrt(((c.x ?? 0) - (d.x ?? 0)) * ((c.x ?? 0) - (d.x ?? 0))
          + ((c.y ?? 0) - (d.y ?? 0)) * ((c.y ?? 0) - (d.y ?? 0))
        );
        //console.log('[DRAG]cx, cy :', c.x, c.y, '|| [NEIGH] d.x, d.y', d.x, d.y, ' =>D:', dist);
        if (dist < closest[0]) closest = [dist, d];
      });
      return closest[1]
    };


    // Define ticked with coords 
    function ticked() {
      self.frameCount++;
      // console.log(`Tick num ${self.frameCount} alpha:${self.simulation.alpha()} alpha_min:${self.simulation.alphaMin()} alpha_decay:${self.simulation.alphaDecay()}`);
      console.log("Tick");
      svgContext.selectAll("line.links")
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

      svgContext.selectAll("circle.nodes")
        .attr("cx", function (d: any) {
          return d.x;
        })
        .attr("cy", function (d: any) {
          return d.y;
        });
    }

    reloadSimulation()

  }

  handleClose = () => {
    this.setState({ show: false });
  };

  handleContextMenu = (event: React.MouseEvent) => {
    console.log("Custom menu");
    event.preventDefault();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element?.tagName === "circle") {
      this.setState({ x: event.clientX, y: event.clientY, nodeClick: element, show: true, });
    }
    else {
      this.setState({ x: event.clientX, y: event.clientY, show: true, });
    }
  };

  render() {

    let node: any = this.state.nodeClick;

    const rmnodefromContextMenu = (event: React.MouseEvent) => {
      console.log("rmnodefromContextMenu", node)
      this.setState({ nodeToRemove: [node] })

      this.handleClose();
    }


    const ifnode = () => {
      if (node) return <MenuItem onClick={rmnodefromContextMenu}> Remove node #{node.id}</MenuItem>;
      else return;
    }

    const removeSelectedNode = (event: React.MouseEvent) => {
      console.log("remove selected nodes");

      const seletectNodes: any[] = [];
      d3.select(this.ref)
        .selectAll<SVGCircleElement, SimulationNode>('circle.onfocus')
        .each((d: any) => seletectNodes.push(d))
      console.log(seletectNodes);
      this.setState({ nodeToRemove: seletectNodes })
      this.handleClose();
    }

    const pasteSelectedNode = (e: React.MouseEvent) => {
      console.log("OLE!!!!")
      const [x, y] = [this.mouseX, this.mouseY]; // Target translation point
      const ghostNodes: Record<string, string | number>[] = [];
      d3.select(this.ref).selectAll<SVGCircleElement, SimulationNode>('circle.onfocus')
        .each((d: SimulationNode) => {
          ghostNodes.push({
            x: d.x ?? 0,
            y: d.y ?? 0,
            gid: d.id
          })
        });
      const [x0, y0] = ghostNodes.reduce<[number, number]>((previousValue, currentDatum, i, arr) => {
        const _x = previousValue[0] + (currentDatum.x as number);
        const _y = previousValue[1] + (currentDatum.y as number);
        return i === arr.length - 1 ? [_x / arr.length, _y / arr.length] : [_x, _y];
      }, [0, 0])

      console.log("Selection barycenter is " + x0, y0);
      console.log("Mouse pointer is " + x, y);

      const [tx, ty] = [x - x0, y - y0];

      console.log("Translation V  is " + tx, ty);

      //Bof 
      d3.select(this.ref).selectAll('g.ghostSel').remove();
      const gSel = d3.select(this.ref).append('g').attr('class', 'ghostSel');
      gSel.selectAll('.ghostNode').data(ghostNodes).enter().append("circle")
        .attr('class', 'ghostNode')
        .attr('cx', (d) => (d.x as number) + tx)
        .attr('cy', (d) => (d.y as number) + ty)
        .style("fill", "gray")
        .attr("r", this.nodeRadius);
      this.handleClose();
    };

    // Si des noeuds sont selectionnés
    const ifSelectedNode = () => {
      const numberCircleSelected = d3.select(this.ref).selectAll('circle.onfocus').size();
      if (numberCircleSelected > 0) {
        return <><MenuItem onClick={(e) => { removeSelectedNode(e); }}> Remove {numberCircleSelected} selected nodes</MenuItem><MenuItem onClick={(e) => { pasteSelectedNode(e); }}> Paste {numberCircleSelected} selected nodes</MenuItem></>;
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
          <MenuItem onClick={this.handleClose}>Awesome feature</MenuItem>
          <MenuItem onClick={this.handleClose}>Super mega idea</MenuItem>
        </Menu>

      </div>);
  }

}