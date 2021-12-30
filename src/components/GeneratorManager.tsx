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

  addlink = (node1 : any , node2 : any): void => {
    let newlinks = ({
      "source": node1,
      "target": node2
    });
    this.setState({ links: this.state.links.concat(newlinks) });
  }


  removenode = (id: string): void => {
    //remove node with a copy of state
    var nodescopy = [...this.state.nodes];
    var index  = nodescopy.findIndex(node => (node.id === id));
    if (index !== -1) {
      nodescopy.splice(index, 1);
      this.setState({nodes: nodescopy});
    }

    //remove link with a copy of state

    let linkscopy = [...this.state.links];
    //first remove links of this node
    let indexlinktoremove =  linkscopy.findIndex(e => (e.source.id === id) || (e.target.id === id) );
    //si index = -1, pas de lien trouvé
    if ( indexlinktoremove !== -1) {
        do {
            linkscopy.splice(indexlinktoremove, 1);
            indexlinktoremove = linkscopy.findIndex(e => (e.source.id === id) || (e.target.id === id) );
        } while (indexlinktoremove !== -1); // tant qu'il reste des links
    }
    this.setState({links: linkscopy});

  }


//// Coriger bug !!!!!!!!! 
  removelink = (link : any): void => {
    let linkscopy = [...this.state.links];
    let indexlinktoremove = linkscopy.findIndex(e => (e.source === link.source) || (e.target === link.target) );
    if (indexlinktoremove === -1){
      indexlinktoremove = linkscopy.findIndex(e => (e.source === link.target) || (e.target === link.source) );
    }
    this.setState({ links : linkscopy.splice(indexlinktoremove, 1) });
  }


  render() {
    return (

      <div>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GeneratorMenu addnode={this.addnode} addlink={this.addlink} />
          </Grid>
          <Grid item xs={8}>
            <PolymerViewer nodes={this.state.nodes} links={this.state.links} rmnode={this.removenode} rmlink={this.removelink} />
          </Grid>
        </Grid>

      </div>

    );
  }
}