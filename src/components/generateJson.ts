import * as d3 from "d3";
import { SimulationNode, SimulationLink } from './SimulationType';


//Format of Json ask by polyply
//{
//     "directed": false,
//     "multigraph": false,
//     "graph": {},
//     "nodes": [
//         {
//             "resname": "glucose",
//             "seqid": 0,
//             "id": 0
//         },
//         {
//             "resname": "glucose",
//             "seqid": 0,
//             "id": 1
//         },
//         {
//             "resname": "glucose",
//             "seqid": 0,
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

function simulationToJsonBlob(simulation: d3.Simulation<SimulationNode, SimulationLink>) {
    const debutstr = '{"directed": false, "multigraph": false, "graph": {}, "nodes": '
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

    let myLinks: any[] = [];
    for (let node of myRawNodes) {
        for (let link of node.links!) {
            //filter existing link
            if (myLinks.filter(e => ((e.target === node.id) && (e.source === link.id))).length === 0) {
                myLinks.push({
                    "source": node.id,
                    "target": link.id,
                })
            }

        }
    }

    // Vraiment super moche  !! 
    // Faire jolie variable json plutot que des str 
    const myJSON = debutstr + JSON.stringify(myNodes) + ',"links":' + JSON.stringify(myLinks) + '}';
    const blob = new Blob([myJSON], { type: "text" });
    return blob
}

export function DownloadJson(simulation: d3.Simulation<SimulationNode, SimulationLink>) {
    console.log("Download json ! ");

    const blob = simulationToJsonBlob(simulation)
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


export function PolyplyJson(simulation: d3.Simulation<SimulationNode, SimulationLink>) {
    const blob = simulationToJsonBlob(simulation)
    console.log("blob")
    console.log(blob)
    // fetching the GET route from the Express server which matches the GET route from server.js

    console.log(blob)
   
    fetch('/sendjson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: blob
      });
}