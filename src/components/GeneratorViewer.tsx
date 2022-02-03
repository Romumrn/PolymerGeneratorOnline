import * as React from "react";
import * as d3 from "d3";
import CustomContextMenu from "./Viewer/CustomContextMenu";
import { SimulationNode, SimulationLink, SimulationGroup } from './Form';
import { initSVG, initSimulation, reloadSimulation } from './Viewer/SimulationSVGFunction';
import { addNodeToSVG, addLinkToSVG } from './addNodeLink';
import './GeneratorViewer.css';


interface propsviewer {
  newNodes: SimulationNode[];
  newLinks: SimulationLink[];
  generateID: () => string;
}

interface statecustommenu {
  x: number,
  y: number,
  nodeClick: SimulationNode | undefined,
  nodeToRemove: SimulationNode[],
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
  currentnodeRadius = 10;
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

  // Init simulation 
  simulation = initSimulation(this.taille, this.currentnodeRadius);

  componentDidMount() {
    //Draw svg frame
    initSVG(this.ref, this.taille);

    const mySVG = d3.select(this.ref)

    mySVG.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 1.8]).on("zoom", (event) => {
      //On recupere la valeur de zoom 
      const zoomValue = event.transform.k;
      //On modifie le rayon en fonction du zoom 
      this.currentnodeRadius = this.nodeRadius * zoomValue;
      console.log(zoomValue);

      mySVG.selectAll("circle")
        .attr("r", this.currentnodeRadius)
        .attr("stroke-width", this.currentnodeRadius / 4)

      mySVG.selectAll("line")
        .attr("stroke-width", this.currentnodeRadius / 3)

      //Change simulation property
      this.simulation.force("link", d3.forceLink()
        .distance(this.currentnodeRadius * 2.5))
        .force("x", d3.forceX(this.taille / 2).strength(0.02 / zoomValue))
        .force("y", d3.forceY(this.taille / 2).strength(0.02 / zoomValue))

      this.UpdateSVG()
    }));
  }


  componentDidUpdate(prevProps: propsviewer, prevStates: statecustommenu) {
    console.log("componentDidUpdate");

    //Check state and props 
    if ((prevProps.newNodes === this.props.newNodes) && (prevProps.newLinks === this.props.newLinks)) {
    }
    else {
      console.log(this.props)
      this.UpdateSVG();
    }

    if (this.state.nodeToRemove !== prevStates.nodeToRemove) {
      console.log(this.state);
      this.UpdateSVG()
    }
    else {
      console.log("same state")
    }
  }

  // Define graph property
  UpdateSVG = () => {
    const svgContext = d3.select(this.ref);

    // Check if we need to remove nodes in state.nodeToRemove
    if (this.state.nodeToRemove.length > 0) {
      console.log("To remove : ", this.state.nodeToRemove);
      for (const node of this.state.nodeToRemove) {
        //console.log("On entre dans la boucle et on supprime ca :", node);
        //remove link in object node
        if (node.links !== undefined) {
          for (let linkednode of node.links) {
            console.log("linkednode", linkednode);
            //remove link between node and removed node
            linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => !this.state.nodeToRemove.includes(nodeToRM));
          }
        }
        svgContext.selectAll<SVGCircleElement, SimulationNode>("circle").filter((d: SimulationNode) => (d.id === node.id)).remove();
        //and then remove link inside svg
        svgContext.selectAll("line").filter((link: any) => ((link.source.id === node.id) || (link.target.id === node.id))).remove();
      }
      this.setState({ nodeToRemove: [], nodeClick: undefined });
      return;
    }

    // Verifier si on doit bien ajouter des props ou si c'est deja fait 
    if (this.prevPropsNewLink !== this.props.newLinks) {
      addLinkToSVG(this.ref, this.currentnodeRadius, this.props.newLinks)
    }

    // Si des news props apparaissent depuis manager on ajoute les noeuds !!!
    if (this.prevPropsNewnode !== this.props.newNodes) {
      addNodeToSVG(this.ref, this.currentnodeRadius, this.props.newNodes, this.simulation)

      //Keep the previous props in memory
      this.prevPropsNewLink = this.props.newLinks;
      this.prevPropsNewnode = this.props.newNodes;
    }
    // Build a list of grouped nodes instead of compute it a each iteration
    const groups: SimulationGroup[] = [];

    const svgPath = [];
    svgContext
      .selectAll('path.area')
      .each(function () {
        svgPath.push(this);
      });

    if (svgPath.length !== 0) {
      for (let i = 1; i <= svgPath.length; i++) {
        let selectedNodes: SimulationNode[] = [];
        d3.select(this.ref).selectAll("circle")
          .filter((d: any) => (d.group === i))
          .each((d: any) => {
            selectedNodes.push(d);
          });
        console.log("groups.push({ id: i, nodes: selectedNodes }) ", i)
        groups.push({ id: i, nodes: selectedNodes })
      }
    }

    reloadSimulation(svgContext, this.simulation, groups)

  }

  handleClose = () => {
    this.setState({ show: false, nodeClick: undefined })
  };


  pasteSelectedNode = (listNodesToPaste: any) => {
    console.log("pasteSelectedNode")
    const idModification: Record<string, string | number>[] = [];
    let oldNodes: SimulationNode[] = []
    listNodesToPaste
      .each((d: SimulationNode) => {
        oldNodes.push(d)
        idModification.push({
          oldID: d.id,
          resname: d.resname,
          newID: this.props.generateID(),
        })
      });

    //Create new node
    let newNodes = []
    for (let node of oldNodes) {
      const oldid = node.id;
      const newid = idModification.filter((d: any) => (d.oldID === oldid))[0].newID
      console.log(node, oldid, newid)
      let newNode = {
        resname: node.resname,
        seqid: 0,
        id: newid
      }
      newNodes.push(newNode)
    }

    addNodeToSVG(this.ref, this.currentnodeRadius, newNodes, this.simulation)

    // and then addLink
    // create newlink
    let newlinks: { source: { resname: string; seqid: number; id: string | number; }; target: { resname: string; seqid: number; id: string | number; }; }[] = []
    for (let oldnode of oldNodes) {
      const newid = idModification.filter((d: any) => (d.oldID === oldnode.id))[0].newID
      const newnodesource = newNodes.filter((d: any) => (d.id === newid))[0]
      if (oldnode.links !== undefined) {
        for (let oldnodelink of oldnode.links) {
          //parmis tous les liens de l'ancien noeud je parcours et j'en creer de nouveau 
          let newtargetid = idModification.filter((d: any) => (d.oldID === oldnodelink.id))[0].newID
          const newnodetarget = newNodes.filter((d: any) => (d.id === newtargetid))[0]
          let newlink = {
            source: newnodesource,
            target: newnodetarget
          }
          //check if the link doesnt exist 
          // BUUUGGGGG §§
          // Link ajouté en double Il faut check si les source target ne sont pas identiques
          newlinks.push(newlink)
        }
      }
    }
    addLinkToSVG(this.ref, this.currentnodeRadius, newlinks)
    this.UpdateSVG()
  }


  handleContextMenu = (event: React.MouseEvent) => {
    console.log("Custom menu");
    event.preventDefault();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element?.tagName === "circle") {
      const nodeToRm: any = d3.select(this.ref).selectAll("circle").filter((d: any) => (d.id === element.id)).data()[0]
      console.log(nodeToRm)
      this.setState({ x: event.clientX, y: event.clientY, nodeClick: nodeToRm, show: true, });
    }
    else {
      this.setState({ x: event.clientX, y: event.clientY, show: true, });
    }
  };

  render() {
    const removeNodesFromContextMenu = (nodetorm: any[]) => {
      this.setState({ nodeToRemove: nodetorm })
    }
    const PasteNodesFromContextMenu = () => {
      this.pasteSelectedNode(d3.select(this.ref).selectAll('circle.onfocus'))
      this.setState({ show: false })
    }

    const ifContextMenuShouldAppear = (show: boolean) => {
      if (show) {
        const CircleSelected = d3.select(this.ref).selectAll('circle.onfocus');
        return <CustomContextMenu
          x={this.state.x}
          y={this.state.y}
          nodeClick={this.state.nodeClick}
          selected={CircleSelected}
          handleClose={this.handleClose}
          svg={d3.select(this.ref)}
          handleRemove={removeNodesFromContextMenu}
          handlePaste={PasteNodesFromContextMenu} 
          simulation={this.simulation}>
        </CustomContextMenu>;
      }
      else return;
    }

    return (
      <div className="svg"
        onContextMenu={this.handleContextMenu}
        style={{ cursor: 'context-menu' }}
        ref={(ref: HTMLDivElement) => this.frame = ref} >

        <svg className="container" id="svg" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>

        {ifContextMenuShouldAppear(this.state.show)}

      </div >);
  }

}