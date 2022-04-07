import * as React from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as d3 from "d3";
import { SimulationNode, SimulationLink, SimulationGroup } from '../SimulationType';
import { DownloadJson } from '../generateJson';
import { addLinkToSVG } from "../addNodeLink";

interface props {
    x: number;
    y: number;
    nodeClick: SimulationNode | undefined,
    hullClick: Element | undefined,
    selected: any;
    simulation: d3.Simulation<SimulationNode, SimulationLink>;
    forcefield: string,
    handleClose: () => void;
    handlePaste: () => void;
    handleUpdate: () => void;
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
}

export default class CustomContextMenu extends React.Component<props> {

    update() {
        this.props.handleUpdate()
    }

    addMagicLink(selected: d3.Selection<SVGSVGElement, SimulationNode, null, undefined>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
        console.log("Add link between node to create a chain")

        let nodetoLink: SimulationNode[] = [];

        //Recherche les nodes sans link ou avec un seul link
        selected.each((d: SimulationNode) => {
            if (!d.links) {
                nodetoLink.push(d)
            }
            else if (d.links!.length === 1) {
                nodetoLink.push(d)
            }
        })

        let newlinks = []

        console.log(nodetoLink)
        // Parcourir la liste pour trouver noeud avec lien manquant avec id consecutif 
        let nextid: number = parseInt(nodetoLink[0].id) + 1
        for (let node of nodetoLink) {

            if (parseInt(node.id) === nextid) {

                let nodetarget = nodetoLink.filter((n) => parseInt(n.id) === (nextid - 1))[0]

                let link = {
                    source: node,
                    target: nodetarget
                }
                newlinks.push(link)

                if (node.links) node.links.push(nodetarget);
                else node.links = [nodetarget];

                if (nodetarget.links) nodetarget.links.push(node);
                else nodetarget.links = [node];


                nextid = parseInt(node.id) + 1
            }
            else nextid = parseInt(node.id) + 1
        }
        addLinkToSVG(newlinks)
        this.props.handleUpdate();
    }

    removeHull = (hull: Element, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //get id of hull 
        const id: string = hull.getAttribute("group")!

        this.props.svg.selectAll<SVGPathElement, SimulationGroup>("path")
            .filter(function (d: SimulationGroup): boolean {
                return (this.getAttribute("group") === id)
            })
            .remove();

        this.props.handleClose();
    }

    removeLink = (node: SimulationNode, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        console.log("Remove links", node)
        if (node.links !== undefined) {
            for (let linkednode of node.links) {
                //remove link between node and removed node
                linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== node.id);
            }
        }

        this.props.svg.selectAll("line").filter((link: any) => ((link.source.id === node.id) || (link.target.id === node.id))).remove();

        delete node.links
        this.props.handleUpdate();
        this.props.handleClose();
    }


    removeBadLinks = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //Iterate throw differents bad links 
        this.props.svg.selectAll<SVGLineElement, SimulationLink>("line.error").
            each((d: SimulationLink) => {
                d.source.links = d.source.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== d.target.id);
                d.target.links = d.target.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== d.source.id);
            })
            .remove()

        this.props.handleUpdate();
        this.props.handleClose();
    }

    giveConnexeNode = (node: SimulationNode, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //Give one node and class on focus rest of polymer nodes 
        //Return one selection of connexe nodes

        //clean the previous selected nodes
        this.props.svg
            .selectAll<SVGCircleElement, SimulationNode>('circle.onfocus')
            .attr("class", "nodes");

        // Create a list and add our initial node in it
        let s = [];
        s.push(node);
        // Mark the first node as explored
        let explored: any[] = [];
        //List of id 
        let connexeNodesId = new Set();
        connexeNodesId.add(node.id);
        //Chek si le noeud n'est pas connecter aux autres 
        if (node.links === undefined) {
            connexeNodesId.add(node.id);
        }
        else {
            //continue while list of linked node is not emphty 
            while (s.length !== 0) {
                let firstNode = s.shift();
                //console.log(firstNode)
                if (firstNode !== undefined) {
                    for (let connectedNodes of firstNode!.links!) {
                        s.push(connectedNodes);
                        connexeNodesId.add(connectedNodes.id);
                    }
                    explored.push(firstNode)
                    s = s.filter(val => !explored.includes(val));
                }
            }
        }
        // Return a selection of one connexe graph 
        // Maybe juste one node
        return svg.selectAll<SVGCircleElement, SimulationNode>('circle').filter((d: SimulationNode) => connexeNodesId.has(d.id))
    }

    //list d3 qui forme le polygon autour de cette liste
    groupPolymer = (listNodesD3: d3.Selection<SVGSVGElement, SimulationNode, null, undefined>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        console.log("find group polymer fonction ", listNodesD3)

        let idCreatedPolygoneNode: SimulationNode[] = [];


        listNodesD3.each((d: SimulationNode) => {
            if ((idCreatedPolygoneNode.includes(d) === false) && (d.group === undefined)) {
                let connexe = this.giveConnexeNode(d, svg);
                if (connexe.size() < 4) {
                    return
                }
                // else if (deja fait donc il faut regarder si les noeuds id sont deja group ou si un des noeud est deja groupé)  ; 
                else {
                    this.createPolymerPolygon(connexe, svg);
                    connexe.each((d: SimulationNode) => {
                        idCreatedPolygoneNode.push(d)
                    });
                };
            }
        })

        this.props.handleUpdate();
        this.props.handleClose();
    }

    createPolymerPolygon = (listNodesD3: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {

        console.log("createPolymerPolygon with ", listNodesD3)

        let groupeID = 1;
        svg.selectAll('path')
            .each(function () {
                var id = d3.select(this).attr("group");
                var numberid: number = +id;
                groupeID = numberid + 1;
            });
        //console.log(groupeID)

        let selectedNodesCoords: [number, number][] = [];
        listNodesD3
            .each((d: SimulationNode) => {
                selectedNodesCoords.push([d.x!, d.y!]);
                d.group = groupeID
            });

        const color = d3.interpolateTurbo(groupeID / 10);

        let hull = d3.polygonHull(selectedNodesCoords);

        let self = this

        svg
            .selectAll("area")
            .data([hull])
            .enter()
            .append("path")
            .attr("expand", "false")
            .attr("group", groupeID)
            .attr("class", "area")
            .attr("d", (d) => "M" + d!.join("L") + "Z")
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", "40")
            .attr("stroke-location", "outside")
            .attr("stroke-linejoin", "round")
            .style("opacity", 0.2)
            .on('click', function (this: SVGPathElement, event: any, d: [number, number][] | null) {
                listNodesD3.each((node: SimulationNode) => { console.log(node) })
                if (this.getAttribute("expand") === "true") {
                    listNodesD3.attr("display", "none")
                    self.update();
                    this.setAttribute("expand", "false")
                }
                else {
                    listNodesD3.attr('display', null)
                    self.update();
                    this.setAttribute("expand", "true")
                }
            });
    }

    removeNode = (node: SimulationNode) => {
        console.log("remove selected nodes", node)
        //remove link in object node
        if (node.links !== undefined) {
            for (let linkednode of node.links) {
                //remove link between node and removed node
                linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== node.id);
            }
        }
        this.props.svg.selectAll<SVGCircleElement, SimulationNode>("circle").filter((d: SimulationNode) => (d.id === node.id)).remove();
        //and then remove link inside svg
        this.props.svg.selectAll("line").filter((link: any) => ((link.source.id === node.id) || (link.target.id === node.id))).remove();

        this.props.handleUpdate();
        this.props.handleClose();
    }

    removeSelectedNodes = (nodes: d3.Selection<SVGSVGElement, SimulationNode, null, undefined>) => {
        nodes.each((node: SimulationNode) => {
            this.removeNode(node);
        })
    }

    // Si des noeuds sont selectionnés
    ifSelectedNode = () => {
        if (this.props.selected.size() > 0) {
            console.log(this.props)
            return <div key={1}>
                <Typography >
                    {this.props.selected.size()} nodes selected
                </Typography>
                <Divider />
                <MenuItem onClick={() => { this.groupPolymer(this.props.selected, this.props.svg) }}> Group this polymer</MenuItem>
                <MenuItem onClick={() => { this.removeSelectedNodes(this.props.selected) }}> Remove {this.props.selected.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.handlePaste() }}> Paste {this.props.selected.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.selected.attr("class", "nodes"); this.props.handleClose(); }}>Unselected</MenuItem>
                <MenuItem onClick={() => { this.addMagicLink(this.props.selected, this.props.svg); this.props.handleClose(); }}>Link it</MenuItem>
            </div>;
        } else {
            return null;
        }
    }

    ifnode = () => {
        if (this.props.nodeClick) {
            return <div key={0}>
                <MenuItem onClick={() => { this.removeLink(this.props.nodeClick!, this.props.svg) }}>Remove link</MenuItem>
                <MenuItem onClick={() => { if (this.props.nodeClick !== undefined) this.removeNode(this.props.nodeClick) }}>Remove node #{this.props.nodeClick.id}</MenuItem>
                <MenuItem onClick={() => { this.giveConnexeNode(this.props.nodeClick!, this.props.svg).attr("class", "onfocus"); this.props.handleClose() }}>Select this polymer</MenuItem>
                <Divider />
            </div>;
        }
        else if (this.props.hullClick) {
            return <div key={0}>
                <MenuItem onClick={() => { this.removeHull(this.props.hullClick!, this.props.svg) }}>Remove group</MenuItem>
                <Divider />
            </div>;
        }
        else return;
    }

    render() {
        return (
            <Menu
                //onClose={this.handleClose}
                anchorReference="anchorPosition"
                anchorPosition={{ top: this.props.y + 2, left: this.props.x + 2 }}
                open={true} >
                {this.ifnode()}
                {this.ifSelectedNode()}
                <MenuItem onClick={() => { this.removeBadLinks(this.props.svg) }}>Remove bad links</MenuItem>
                <MenuItem onClick={() => { DownloadJson(this.props.simulation, this.props.forcefield); this.props.handleClose(); }}>Download Json</MenuItem>
                <MenuItem onClick={this.props.handleClose}>Close</MenuItem>

            </Menu>
        )
    }
}
