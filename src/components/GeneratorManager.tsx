import { Grid } from "@mui/material";
import * as React from "react";
import GeneratorMenu from './GeneratorMenu';
import PolymerViewer from './GeneratorViewer';
import { FormState, SimulationNode, SimulationLink } from './Form'

// Pour plus tard
//https://github.com/korydondzila/React-TypeScript-D3/tree/master/src/components
//
// Objectif : faire pareil avec element selectionnable dans le bloc menu et ajoutable dans le bloc viewer si deposer
//https://javascript.plainenglish.io/how-to-implement-drag-and-drop-from-react-to-svg-d3-16700f01470c
interface StateSimulation {
  nodes: SimulationNode[],
  links: SimulationLink[],
  dataForForm: {},
}

export default class GeneratorManager extends React.Component {

  state: StateSimulation = {
    nodes: [],
    links: [],
    dataForForm: {},
  }

  currentAvaibleID = 0;
  generateID = (): string => {
    this.currentAvaibleID++;
    return this.currentAvaibleID.toString()
  }

  addnode = (toadd: FormState): void => {
    const newMolecule: SimulationNode[] = [];
    let newlinks = [];
    // convert to node objt et injecte dans la list
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
    this.setState({ links: newlinks });
    this.setState({ nodes: newMolecule });
  }

  addlink = (node1: SimulationNode, node2: SimulationNode): void => {
    let newlinks = [{
      "source": node1,
      "target": node2
    }];
    if (node1.links) node1.links.push(node2);
    else node1.links = [node2];

    if (node2.links) node2.links.push(node1);
    else node2.links = [node1];

    this.setState({ links: newlinks });
  }


  removenode = (id: string): void => {
    //remove node with a copy of state
    var nodescopy = [...this.state.nodes];
    var index = nodescopy.findIndex(node => (node.id === id));
    console.log("Remove node ", id);
    if (index !== -1) {
      nodescopy.splice(index, 1);
      this.setState({ nodes: nodescopy });
    }

    //remove link with a copy of state

    let linkscopy = [...this.state.links];
    //first remove links of this node
    let indexlinktoremove = linkscopy.findIndex(e => (e.source.id === id) || (e.target.id === id));
    //si index = -1, pas de lien trouvé
    if (indexlinktoremove !== -1) {
      do {
        linkscopy.splice(indexlinktoremove, 1);
        indexlinktoremove = linkscopy.findIndex(e => (e.source.id === id) || (e.target.id === id));
      } while (indexlinktoremove !== -1); // tant qu'il reste des links
    }
    this.setState({ links: linkscopy });
  }

  componentDidMount() {
    this.callBackendAPI()
      .then((value: {}) => this.setState({ dataForForm: value}) )
      .catch(err => console.log(err));
    
    console.log(this.state)
  }
  // fetching the GET route from the Express server which matches the GET route from server.js
  callBackendAPI = async () => {
    const response = await fetch('/data');
    const body = await response.json();
    console.log( "fetch")
    console.log(body)
    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  };

  render() {
    return (

      <div>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GeneratorMenu addnode={this.addnode} addlink={this.addlink} dataForceFieldMolecule={this.state.dataForForm} />
          </Grid>
          <Grid item xs={8}>
            <PolymerViewer newNodes={this.state.nodes} newLinks={this.state.links} generateID={this.generateID} />
          </Grid>
        </Grid>

      </div>

    );
  }
}