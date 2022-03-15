import { CircularProgress, Grid } from "@mui/material";
import * as React from "react";
import GeneratorMenu from './GeneratorMenu';
import PolymerViewer from './GeneratorViewer';
import { FormState, SimulationNode, SimulationLink } from './SimulationType'
import Warning from "./warning";
import { simulationToJson } from './generateJson';
import { checkLink } from './addNodeLink';
import io from 'socket.io-client';

// Pour plus tard
//https://github.com/korydondzila/React-TypeScript-D3/tree/master/src/components
//
// Objectif : faire pareil avec element selectionnable dans le bloc menu et ajoutable dans le bloc viewer si deposer
//https://javascript.plainenglish.io/how-to-implement-drag-and-drop-from-react-to-svg-d3-16700f01470c
interface StateSimulation {
  Simulation: d3.Simulation<SimulationNode, SimulationLink> | undefined,
  Warningmessage: string;
  nodesToAdd: SimulationNode[],
  linksToAdd: SimulationLink[],
  dataForForm: { [forcefield: string]: string[] },
  loading: Boolean
}

export default class GeneratorManager extends React.Component {

  state: StateSimulation = {
    Simulation: undefined,
    nodesToAdd: [],
    linksToAdd: [],
    dataForForm: {},
    Warningmessage: "",
    loading: false
  }

  currentAvaibleID = -1;
  generateID = (): string => {
    this.currentAvaibleID++;
    return this.currentAvaibleID.toString()
  }


  currentForceField = '';

  addprotsequence = (sequence: string) => {
    let i = 0;
    const fastaconv: { [aa: string]: string } = {
      'CYS': 'C', 'ASP': 'D', 'SER': 'S', 'GLN': 'Q', 'LYS': 'K',
      'ILE': 'I', 'PRO': 'P', 'THR': 'T', 'PHE': 'F', 'ASN': 'N',
      'GLY': 'G', 'HIS': 'H', 'LEU': 'L', 'ARG': 'R', 'TRP': 'W',
      'ALA': 'A', 'VAL': 'V', 'GLU': 'E', 'TYR': 'Y', 'MET': 'M'
    }

    // VERIFIER SI LE FORCEFIELD CONTIENT LES AA 
    // Aficher message d'erreur 
    for (let aa of Object.keys(fastaconv)) {
      if (!this.state.dataForForm[this.currentForceField].includes(aa)) {
        this.setState({ Warningmessage: "This residue (" + aa + " ) is not in this forcefield " + this.currentForceField })
        return
      }
    }

    const newMolecule: SimulationNode[] = [];
    let newlinks = [];

    // convert to node object et injecte dans la list
    for (let res of sequence) {
      //find 3 letter code 

      let res3: string = Object.keys(fastaconv).find((key: string) => fastaconv[key] === res)!
      console.log(res3)
      let mol = {
        "resname": res3,
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
      i++

    }
    this.setState({ linksToAdd: newlinks });
    this.setState({ nodesToAdd: newMolecule });

  }

  addnodeFromJson = (jsonFile: any): void => {
    // Warning !! 
    // Attention a l'id qui est different entre la nouvelle representation et l'ancien json 
    // besoin de faire une table de correspondance ancien et nouveau id

    //Check forcefield !! 
    if (this.currentForceField === '') {
      console.log("this.currentForceField === ")
      this.currentForceField = jsonFile.forcefield
    }

    else if ((this.currentForceField !== jsonFile.forcefield) && (jsonFile.forcefield !== undefined)) {
      this.setState({ Warningmessage: "Wrong forcefield " + this.currentForceField + " different than " + jsonFile.forcefield })
    }
    else {
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
      this.setState({ linksToAdd: newlinks });
      this.setState({ nodesToAdd: newMolecule });
    }

  }

  setForcefield = (ff: string): void => {
    if ((this.currentForceField === '') || (this.currentForceField === ff)) {
      this.currentForceField = ff
    }
    else if (this.state.nodesToAdd.length === 0) {

      this.currentForceField = ff
    }
    else {
      this.setState({ Warningmessage: "Change forcefield to " + this.currentForceField })
    }

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
    const listnode = this.state.Simulation?.nodes().concat(this.state.nodesToAdd);
    const node1 = listnode?.find(element => element.id === id1);
    const node2 = listnode?.find(element => element.id === id2);

    console.log(listnode, node1, node2)
    const warningfunction = (message: string) => {
      this.setState({ Warningmessage: message })
    }


    if (node1 === undefined) {
      this.setState({ Warningmessage: "Nodes id number " + id1 + " does not exist" });
      return
    }
    if (node2 === undefined) {
      this.setState({ Warningmessage: "Nodes id number " + id2 + " does not exist" });
      return
    }

    checkLink(node1, node2, warningfunction)

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

  sendToServer = (): void => {
    this.setState({ loading: true })
    console.log("Go to server");
    if (this.state.Simulation === undefined) {
      this.setState({ Warningmessage: "Error Simulation undefined " })
    }
    else {
      const data = simulationToJson(this.state.Simulation!, this.currentForceField)

      const socket = io({ path: '/socket' })

      socket.on("connect", () => {
        console.log("connect")
        socket.emit('testpolyply', data)
      })
      console.dir(socket)

      socket.on("res", (data: string[]) => {

        const blob = new Blob([data[1]], { type: "text" });
        console.log([data[1]])
        if (data[1] === "") {
          this.setState({ Warningmessage: "Fail ! Something goes wrong. " })
        }
        else {
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
        }

        this.setState({ loading: false })
      })


    }

  }

  componentDidMount() {
    this.getDataForcefield()
      .then((value: any) => this.setState({ dataForForm: value }))
      .catch(err => { console.log(err); this.setState({ dataForForm: {} }) });
  }

  // fetching the GET route from the Express server which matches the GET route from server.js
  getDataForcefield = async () => {
    const response = await fetch('/api/data');
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
            <GeneratorMenu
              addprotsequence={this.addprotsequence}
              setForcefield={this.setForcefield}
              addnodeFromJson={this.addnodeFromJson}
              addnode={this.addnode}
              addlink={this.addlink}
              send={this.sendToServer}
              dataForceFieldMolecule={this.state.dataForForm} />

            {this.state.loading ? (
              <CircularProgress />
            ) : (<></>)
            }
          </Grid>
          <Grid item xs={8}>
            <PolymerViewer
              forcefield={this.currentForceField}
              getSimulation={(SimulationFromViewer: d3.Simulation<SimulationNode, SimulationLink>) => { this.setState({ Simulation: SimulationFromViewer }) }}
              newNodes={this.state.nodesToAdd}
              newLinks={this.state.linksToAdd}
              generateID={this.generateID} />
          </Grid>
        </Grid>

      </div>
    );
  }
}