import { SimulationNode, SimulationLink } from './Form';
import * as d3 from "d3";


let Mysvg: SVGElement;
export function setSVG(svgref: SVGElement) {
    Mysvg = svgref;
}

export function addNodeToSVG(radius: number, newnode: SimulationNode[], simulation: any, update: () => void) {
    const node = d3.select(Mysvg).selectAll("circle")
        .data(newnode, (d: any) => d.id)
        .enter();

    // Define entering nodes     
    node.append('circle')
        .attr("class", "nodes")
        .attr("r", radius)
        .attr("fill", function (d: SimulationNode) { return hashStringToColor(d.resname) })
        .attr('stroke', "grey")
        .attr("stroke-width", radius / 4)
        .attr("id", function (d: SimulationNode) { return d.id })
        .call(d3.drag<SVGCircleElement, SimulationNode>()
            .on("drag", dragged)
            .on("end", dragended)
        )
        .on('click', function (this: any, e: any, d: SimulationNode) {
            if (e.ctrlKey) {
                d3.select(this).attr("class", "onfocus")
            }
            else console.log(d);
        });

    //Need to be attach with a g node
    // Add a title to each node with his name and his id
    node.append("title")
        .text(function (d: SimulationNode) {
            let title = d.resname + " : " + d.id;
            return title;
        })

    // Define drag behaviour  
    type dragEvent = d3.D3DragEvent<SVGCircleElement, SimulationNode, any>;

    const clamp = (x: number, lo: number, hi: number) => {
        return x < lo ? lo : x > hi ? hi : x;
    }

    function dragged(event: dragEvent, d: SimulationNode) {
        if (event.sourceEvent.shiftKey) {
            console.log("Shift key is pressed/ skipping dragged!");
            return;
        }
        const sizeSVG = d3.select(Mysvg).attr("height");
        // secret trick 
        const sizeSVGNumber: number = +sizeSVG;
        d.fx = clamp(event.x, 0, sizeSVGNumber);
        d.fy = clamp(event.y, 0, sizeSVGNumber);

        simulation
            .alphaDecay(.0005)
            .velocityDecay(0.2)
            .alpha(0.1)
            .restart();
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
        if (closest) {
            if (checkLink(d, closest)) {
                const newlink = { source: d, target: closest }

                if (d.links) d.links.push(closest);
                else d.links = [closest];

                if (closest.links) closest.links.push(d);
                else closest.links = [d];

                d3.select(Mysvg).selectAll("line")
                    .data([newlink], (d: any) => d.source.id + "-" + d.target.id)
                    .enter();
                addLinkToSVG(radius, [newlink]);
                update();
            }
        }
        simulation.velocityDecay(0.3)
            .alphaDecay(0.0228/*1 - Math.pow(0.001, 1 / self.simulation.alphaMin())*/)
            .alpha(1)
            .alphaTarget(0)
            .restart();
    }

    //Add function to detect contact between nodes and create link
    const incontact = (c: SimulationNode): SimulationNode | null => {
        let closest: [number, SimulationNode | null] = [radius * 2.2, null];
        simulation.nodes().forEach((d: SimulationNode) => {
            if (d.id === c.id) return;
            const dist = Math.sqrt(((c.x ?? 0) - (d.x ?? 0)) * ((c.x ?? 0) - (d.x ?? 0))
                + ((c.y ?? 0) - (d.y ?? 0)) * ((c.y ?? 0) - (d.y ?? 0))
            );
            if (dist < closest[0]) closest = [dist, d];
        });
        return closest[1]
    };

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

export function checkLink(node1: SimulationNode, node2: SimulationNode) {
    console.log("checkLink", node1, node2);
    console.log(node1.id, node1.links);
    console.log(node2.id, node2.links);
    if ((node1.links === undefined) || (node2.links === undefined)) return true;
    else if (node1.links!.length >= 3) {
        alert("Node number #" + node1.id + "  too many links ");
        return false;
    }
    else if (node2.links!.length >= 3) {
        alert("Node number #" + node2.id + "  too many links ");
        return false;
    }
    else return true;
}

export function addLinkToSVG(radius: number, newLink: SimulationLink[]): void {
    const link = d3.select(Mysvg).selectAll("line")
        .data(newLink, (d: any) => d.source.id + "-" + d.target.id)
        .enter();

    link.append("line")
        .attr("class", "links")
        .attr("stroke", "grey")
        .attr("stroke-width", radius / 3)
        .attr("opacity", 0.5)
        .attr("stroke-linecap", "round")
        .attr("source", function (d: any) { return d.source.id })
        .attr("target", function (d: any) { return d.target.id });
}