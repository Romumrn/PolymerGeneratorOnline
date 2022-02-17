import { Grid } from "@mui/material";
import * as React from "react";
import GeneratorMenu from './GeneratorMenu';
import PolymerViewer from './GeneratorViewer';
import { FormState, SimulationNode, SimulationLink } from './SimulationType'
import Warning from "./warning";

// Pour plus tard
//https://github.com/korydondzila/React-TypeScript-D3/tree/master/src/components
//
// Objectif : faire pareil avec element selectionnable dans le bloc menu et ajoutable dans le bloc viewer si deposer
//https://javascript.plainenglish.io/how-to-implement-drag-and-drop-from-react-to-svg-d3-16700f01470c
interface StateSimulation {
  currantNodes: SimulationNode[],
  Warningmessage: string;
  nodesToAdd: SimulationNode[],
  linksToAdd: SimulationLink[],
  dataForForm: {},
}

export default class GeneratorManager extends React.Component {

  state: StateSimulation = {
    currantNodes: [],
    nodesToAdd: [],
    linksToAdd: [],
    dataForForm: {},
    Warningmessage: ""
  }

  currentAvaibleID = 0;
  generateID = (): string => {
    this.currentAvaibleID++;
    return this.currentAvaibleID.toString()
  }

  currentForceField = '';

  addnodeFromJson = (jsonFile: any): void => {
    // Waring !! 
    // Attention a l'id qui est different entre la nouvelle representation et l'ancien json 
    // besoin de faire une table de correspondance ancien et nouveau id
    const idModification: Record<string, string | number>[] = [];

    const newMolecule: SimulationNode[] = [];
    for (let node of jsonFile.nodes) {
      const newid = this.generateID()
      idModification.push({
        oldID: node.id,
        newID: newid,
      })

      node.id = newid
      newMolecule.push(node)
    }

    let newlinks = []
    for (let link of jsonFile.links) {
      //Transform old id to new id ! 
      const sourceNewID = idModification.filter((d: any) => (d.oldID === link.source))[0].newID
      const targetNewID = idModification.filter((d: any) => (d.oldID === link.target))[0].newID
      let node1 = newMolecule.filter((d: SimulationNode) => (d.id === sourceNewID))[0]
      let node2 = newMolecule.filter((d: SimulationNode) => (d.id === targetNewID))[0]
      newlinks.push({
        "source": node1,
        "target": node2
      });

      if (node1.links) node1.links.push(node2);
      else node1.links = [node2];

      if (node2.links) node2.links.push(node1);
      else node2.links = [node1];

    }
    this.setState({ links: newlinks });
    this.setState({ nodesToAdd: newMolecule });
  }

  addnode = (toadd: FormState): void => {
    //Check forcefield 
    if ((this.currentForceField === '') || (this.currentForceField === toadd.forcefield)) {
      this.currentForceField = toadd.forcefield;
      const newMolecule: SimulationNode[] = [];
      let newlinks = [];
      // convert to node object et injecte dans la list
      for (let i = 0; i < toadd.numberToAdd; i++) {
        let mol = {
          "resname": toadd.moleculeToAdd,
          "seqid": 0,
          "id": this.generateID(),
        };
        newMolecule.push(mol)

        // If last molecule do not create link with the next mol
        if (i > 0) {
          newlinks.push({
            "source": newMolecule[i - 1],
            "target": newMolecule[i]
          });
          if (newMolecule[i - 1].links) newMolecule[i - 1].links!.push(newMolecule[i]);
          else newMolecule[i - 1].links = [newMolecule[i]];

          if (newMolecule[i].links) newMolecule[i].links!.push(newMolecule[i - 1]);
          else newMolecule[i].links = [newMolecule[i - 1]];
          // add to state
        }

      }
      this.setState({ linksToAdd: newlinks });
      this.setState({ nodesToAdd: newMolecule });
    }
    else {

      this.setState({ Warningmessage: "Change forcefield to " + this.currentForceField })
    }


  }

  addlink = (id1: string, id2: string): void => {
    //1st step find correspondant nodes objects 
    const listnode = this.state.currantNodes.concat(this.state.nodesToAdd);
    const node1 = listnode.find(element => element.id === id1);
    const node2 = listnode.find(element => element.id === id2);

    console.log(listnode, node1, node2)
    if (node1 === undefined) {
      this.setState({ Warningmessage: "Nodes id number " + id1 + " does not exist" });
      return
    }
    if (node2 === undefined) {
      this.setState({ Warningmessage: "Nodes id number " + id2 + " does not exist" });
      return
    }
    let newlinks = [{
      "source": node1,
      "target": node2
    }];
    if (node1.links) node1.links.push(node2);
    else node1.links = [node2];

    if (node2.links) node2.links.push(node1);
    else node2.links = [node1];

    this.setState({ linksToAdd: newlinks });
  }



  removenode = (id: string): void => {
    //remove node with a copy of state
    var nodescopy = [...this.state.nodesToAdd];
    var index = nodescopy.findIndex(node => (node.id === id));
    console.log("Remove node ", id);
    if (index !== -1) {
      nodescopy.splice(index, 1);
      this.setState({ nodesToAdd: nodescopy });
    }

    //remove link with a copy of state
    let linkscopy = [...this.state.linksToAdd];
    //first remove links of this node
    let indexlinktoremove = linkscopy.findIndex(e => (e.source.id === id) || (e.target.id === id));
    //si index = -1, pas de lien trouvé
    if (indexlinktoremove !== -1) {
      do {
        linkscopy.splice(indexlinktoremove, 1);
        indexlinktoremove = linkscopy.findIndex(e => (e.source.id === id) || (e.target.id === id));
      } while (indexlinktoremove !== -1); // tant qu'il reste des links
    }
    this.setState({ linksToAdd: linkscopy });
  }

  componentDidMount() {
    this.callBackendAPI()
      .then((value: {}) => this.setState({ dataForForm: value }))
      .catch(err => console.log(err));
  }

  // fetching the GET route from the Express server which matches the GET route from server.js
  callBackendAPI = async () => {
    const response = await fetch('/data');
    const body = await response.json();
    console.log("load data forcefield")
    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  };

  render() {
    return (
      <div>
        <Warning message={this.state.Warningmessage} close={() => { this.setState({ Warningmessage: "" }) }}></Warning>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GeneratorMenu addnodeFromJson={this.addnodeFromJson} addnode={this.addnode} addlink={this.addlink} dataForceFieldMolecule={this.state.dataForForm} />
          </Grid>
          <Grid item xs={8}>
            <PolymerViewer getNodes={(nodesList: SimulationNode[]) => { this.setState({ currantNodes: nodesList }) }}
              newNodes={this.state.nodesToAdd} newLinks={this.state.linksToAdd} generateID={this.generateID} />
          </Grid>
        </Grid>

      </div>
    );
  }
}