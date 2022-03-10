import * as d3 from "d3";
import { SimulationNode, SimulationLink } from './SimulationType';
import io from 'socket.io-client';



//Format of Json ask by polyply
//{
//     "directed": false,
//     "multigraph": false,
//     "graph": {},
//     "nodes": [
//         {
//             "resname": "glucose",
//             "resid": 0,
//             "id": 0
//         },
//         {
//             "resname": "glucose",
//             "resid": 0,
//             "id": 1
//         },
//         {
//             "resname": "glucose",
//             "resid": 0,
//             "id": 2
//         }
//     ],
//     "links": [
//         {
//             "source": 0,
//             "target": 1
//         },
//         {
//             "source": 0,
//             "target": 2
//         }
//     ]
// }

function simulationToJsonBlob(simulation: d3.Simulation<SimulationNode, SimulationLink>, ff: string) {


    // Vraiment super moche  !! 
    // Faire jolie variable json plutot que des str 
    const myJSON = simulationToJson(simulation, ff)

    const blob = new Blob([JSON.stringify(myJSON)], { type: "text" });
    return blob
}

export function simulationToJson(simulation: d3.Simulation<SimulationNode, SimulationLink>, ff: string) {

    const myRawNodes = simulation.nodes();
    const _ = myRawNodes.map(obj => {
        return {
            "resname": obj.resname,
            "seqid": 0,
            "id": Number(obj.id)
        }
    });



    const myLinks: { "source": number, "target": number }[] = [];
    for (let node of myRawNodes) {
        for (let link of node.links!) {
            //filter existing link
            if (myLinks.filter(e => ((e.target === Number(node.id)) && (e.source === Number(link.id)))).length === 0) {
                myLinks.push({
                    "source": Number(node.id),
                    "target": Number(link.id),
                })
            }

        }
    }

    return {
        "forcefield": ff,
        "directed": false,
        "multigraph": false,
        "graph": {},
        "nodes": _,
        "links": myLinks
    }
}

export function DownloadJson(simulation: d3.Simulation<SimulationNode, SimulationLink>, ff: string) {
    console.log("Download json ! ");

    const blob = simulationToJsonBlob(simulation, ff)
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
}

export function PolyplyJson(simulation: d3.Simulation<SimulationNode, SimulationLink>, ff: string) {
    const data = simulationToJson(simulation, ff)

    const socket = io({ path: '/socket' })

    socket.on("connect", () => {
        console.log("connect")
        socket.emit('testpolyply', data)
    })
    console.dir(socket)

    socket.on("res", (data: string[]) => {

        const blob = new Blob( [data[1] ], { type: "text" });

        const a = document.createElement("a");
        a.download = "out.gro";
        a.href = window.URL.createObjectURL(blob);
        const clickEvt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        a.dispatchEvent(clickEvt);
        a.remove();

    })
    //socket.on('evt2', data)


    // fetch('/testPolyply', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json;charset=utf-8'
    //     },
    //     body: blob
    // });
}