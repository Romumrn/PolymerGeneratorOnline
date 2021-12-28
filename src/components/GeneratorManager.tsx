import { Grid } from "@mui/material";
import * as React from "react";
import GeneratorMenu from './GeneratorMenu';
import PolymerViewer from './GeneratorViewer';

// Pour plus tard
//https://github.com/korydondzila/React-TypeScript-D3/tree/master/src/components
//
// Objectif : faire pareil avec element selectionnable dans le bloc menu et ajoutable dans le bloc viewer si deposer
//https://javascript.plainenglish.io/how-to-implement-drag-and-drop-from-react-to-svg-d3-16700f01470c


export default class GeneratorManager extends React.Component {

  state = {
    nodes: Array(),
    links: Array()
  }
  id = 0;

  addnode = (toadd: any): void => {
    let newMolecule = [];
    let newlinks = [];
    // convert to node objt et injecte dans la list
    if (toadd.numberToAdd === 1) {
      newMolecule.push({
        "resname": toadd.moleculeToAdd,
        "seqid": 0,
        "id": this.id,
        "cx": 30 * this.id,
        "cy": 40 * this.id,
      });
      this.id++;
    }
    else {
      let previousMol;
      for (let i = 0; i !== toadd.numberToAdd; i++) {
        let mol = {
          "resname": toadd.moleculeToAdd,
          "seqid": 0,
          "id": this.id,
          "cx": (100 + this.id * 20),
          "cy": (150 + this.id * 50),
        };

        newMolecule.push(mol)

        // If last molecule do not create link with the next mol
        if (previousMol !== undefined) {
          newlinks.push({
            "source": previousMol,
            "target": mol
          });
          // add to state
        }
        previousMol = mol;
        this.id++;
      }
    }
    this.setState({ links: this.state.links.concat(newlinks) });
    this.setState({ nodes: this.state.nodes.concat(newMolecule) });
  }

  removenode = (id: string): void => {
    let nodes = this.state.nodes;
    let links = this.state.links;
    console.log("id function" , id);
    console.log(this.state);
    let nodetoremove  = nodes.find(n => (n.id === id));
    //first remove links of this node
    let indexlinktoremove =  links.findIndex(e => (e.source === nodetoremove) || (e.target === nodetoremove) );
    //si index = -1, pas de lien trouvé
    if ( indexlinktoremove !== -1) {
        do {
            links.splice(indexlinktoremove, 1);
            indexlinktoremove = links.findIndex(e => (e.source === nodetoremove) || (e.target === nodetoremove) );
        } while (indexlinktoremove !== -1); // tant qu'il reste des links
    }
    // remove the node from nodes list
    // Pourquoi setSate supprime tous lors du rendu ???
    this.setState({ nodes: nodes.splice(nodetoremove.id , 1) });
    console.log("index to remove" ,nodetoremove.id);
  }

  rmlink = (node1: any , node2 : any): void => {
    let links = this.state.links;
    let indexlinktoremove = links.findIndex(e => (e.source === node1) || (e.target === node2) );
    this.setState({ links : links.splice(indexlinktoremove, 1) });
  }


  render() {
    return (

      <div>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GeneratorMenu addnode={this.addnode} />
          </Grid>
          <Grid item xs={8}>
            <PolymerViewer nodes={this.state.nodes} links={this.state.links} rmnode={this.removenode} rmlink={this.rmlink} />
          </Grid>
        </Grid>

      </div>

    );
  }
}