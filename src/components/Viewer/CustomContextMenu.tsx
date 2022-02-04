import * as React from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import * as d3 from "d3";
import { SimulationNode, SimulationLink } from '../Form';

interface props {
    x: number;
    y: number;
    nodeClick: SimulationNode | undefined;
    selected: any;
    simulation: d3.Simulation<SimulationNode, SimulationLink>;
    handleClose: () => void;
    handleRemove: (node: any[]) => void;
    handlePaste: () => void;
    handleUpdate: () => void;
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

}

export default class CustomContextMenu extends React.Component<props> {

    exportJson = (simulation: d3.Simulation<SimulationNode, SimulationLink>) => {
        console.log("Download json ! ");
        const myRawNodes = simulation.nodes();
        //   {
        //     "resname": "glucose",
        //     "seqid": 0,
        //     "id": 0
        //  }
        const myNodes = myRawNodes.map(obj => {
            return {
                "resname": obj.resname,
                "seqid": 0,
                "id": obj.id
            }
        });

        const myJSON = JSON.stringify(myNodes);
        const blob = new Blob([myJSON], { type: "text" });
        const a = document.createElement("a");
        a.download = "file.json";
        a.href = window.URL.createObjectURL(blob);
        const clickEvt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        a.dispatchEvent(clickEvt);
        a.remove();
        this.setState({ show: false });
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
            if ((idCreatedPolygoneNode.includes(d) === false)  && ( d.group === undefined)){
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

    createPolymerPolygon = (listNodesD3: any, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {

        console.log("createPolymerPolygon with ", listNodesD3)

        let groupeID = 1;
        svg.selectAll('path')
            .each(function () {
                var id = d3.select(this).attr("group");
                var numberid: number = +id;
                groupeID = numberid + 1;
            });
        console.log(groupeID)

        let selectedNodesCoords: [number, number][] = [];
        listNodesD3
            .each((d: SimulationNode) => {
                selectedNodesCoords.push([d.x!, d.y!]);
                d.group = groupeID
            });

        const color = d3.interpolateTurbo(groupeID / 10);

        let hull = d3.polygonHull(selectedNodesCoords);

        svg
            .selectAll("area")
            .data([hull])
            .enter().append("path")
            .attr("group", groupeID)
            .attr("class", "area")
            .attr("d", (d) => "M" + d!.join("L") + "Z")
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", "40")
            .attr("stroke-location", "outside")
            .attr("stroke-linejoin", "round")
            .style("opacity", 0.2)
            .on('click', function (this: any, e: any) {
                listNodesD3.attr("opacity", 0.2)
                console.log(this);
            });
    }



    removeNode = (node: SimulationNode | undefined) => {
        console.log("rmnodefromContextMenu", node)
        this.props.handleRemove([node])
        this.props.handleClose();
    }

    removeSelectedNodes = (nodesToRemove: any) => {
        console.log(nodesToRemove)
        console.log("remove selected nodes");
        const seletectNodes: SimulationNode[] = [];
        nodesToRemove.each((d: SimulationNode) => seletectNodes.push(d))
        this.props.handleRemove(seletectNodes)
        this.props.handleClose();
    }

    // Si des noeuds sont selectionnés
    ifSelectedNode = () => {
        if (this.props.selected.size() > 0) {
            console.log(this.props)
            return <div key={1}>
                <MenuItem onClick={() => { this.groupPolymer(this.props.selected, this.props.svg) }}> Group this polymer</MenuItem>
                <MenuItem onClick={() => { this.removeSelectedNodes(this.props.selected) }}> Remove {this.props.selected.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.handlePaste() }}> Paste {this.props.selected.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.selected.attr("class", "nodes"); this.props.handleClose(); }}>Unselected</MenuItem>
            </div>;
        } else {
            return null;
        }
    }

    ifnode = () => {
        if (this.props.nodeClick) {
            return <div key={0}>
                <MenuItem onClick={() => { this.removeNode(this.props.nodeClick) }}>Remove node #{this.props.nodeClick.id}</MenuItem>
                <MenuItem onClick={() => { this.giveConnexeNode(this.props.nodeClick!, this.props.svg).attr("class", "onfocus"); this.props.handleClose() }}>Select this polymer</MenuItem>
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
                <MenuItem onClick={() => { this.exportJson(this.props.simulation) }}>Download Json</MenuItem>
                <MenuItem onClick={this.props.handleClose}>Super mega idea</MenuItem>
                <MenuItem onClick={this.props.handleClose}>Close</MenuItem>
            </Menu>
        )
    }
}
