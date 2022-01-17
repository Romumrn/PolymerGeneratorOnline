import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import DataForm from '../data/DataForm.json';

interface propsmenu {
  addnode: (arg0: resform) => void,
  addlink: (arg1: any, arg2: any) => void
}

interface resform {
  forcefield: string | null;
  moleculeToAdd: string | null;
  numberToAdd: number | null;
  id1: number | undefined;
  id2: number | undefined;
}

export default class GeneratorMenu extends React.Component<propsmenu, resform> {

  constructor(props: propsmenu) {
    // Required step: always call the parent class' constructor
    super(props);

    // Set the state directly. Use props if necessary.
    this.state = {
      forcefield: null,
      moleculeToAdd: null,
      numberToAdd: 1,
      id1: undefined,
      id2: undefined,
    }
  }

  GetMolFField(jsonformdata: any, ff: string): string[] {
    return jsonformdata[ff];
  }

  CheckNewMolecule( ): void {
    if( this.state.forcefield == null){
      alert( "Field Forcefield null")
    }
    else if( this.state.moleculeToAdd == null){
      alert( "Field Molecule null")
    }
    else{
      this.props.addnode(this.state)
    }
  }



  CheckNewLink(idLink1: number | undefined, idLink2: number | undefined): void {
    // check undefined value : 

    if ((typeof (idLink1) == 'undefined') || (typeof (idLink2) == 'undefined')) {
      alert("Problem link : id number undefined")

    }
    else {
      //Load list of Id avaible and check 
      //first generate fake list 
      const avaibleLink = [];
      for (let i = 0; i <= 100; i++) {
        avaibleLink.push(i);
      }

      if ((idLink1! in avaibleLink) && (idLink2! in avaibleLink)) {
        this.props.addlink(idLink1, idLink2)
      }
      else {
        alert("Problem link : id number out of avaible id")
      }
    }
  }


  render() {
    let forcefield = this.state.forcefield;

    const showMoleculeForm = () => {
      if (forcefield) {
        return <div>
          <p>Upload your previous polymer</p>
          <input type="file" id="docpicker" accept=".json" />

          <p>Add your molecule :</p>

          <Select
            id="moleculeToAdd"
            label="Molecule"
            variant="outlined"
            defaultValue=''
            onChange={v => this.setState({ moleculeToAdd: v.target.value })}
          >

            {this.GetMolFField(DataForm, forcefield).map(e => {
              return (<MenuItem key={e} value={e}> {e} </MenuItem>)
            })
            }

          </Select>
          <TextField
            label="numberToAdd"
            type="number"
            InputProps={{ inputProps: { min: 1, max: 100 } }}
            value={this.state.numberToAdd}
            onChange={v => this.setState({ numberToAdd: Number(v.target.value) })}
            variant="outlined"
          />

          <Button
            id="addmol"
            variant="contained"
            onClick={() => this.CheckNewMolecule()}>
            add
          </Button>

          <p>Add a new link : </p>

          <TextField
            label="id1"
            type="number"
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            value={this.state.id1}
            onChange={v => this.setState({ id1: Number(v.target.value) })}
            variant="outlined"
          />
          <TextField
            label="id2"
            type="number"
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            value={this.state.id2}
            onChange={v => this.setState({ id2: Number(v.target.value) })}
            variant="outlined"
          />

          <Button
            id="addlink"
            variant="contained"
            onClick={() => this.CheckNewLink(this.state.id1, this.state.id2)}>
            Add link
          </Button>
        </div>
      } else {
        return null;
      }
    }



    return (
      <div>

        <form>
          <p>Choose your forcefield :</p>

          <InputLabel id="select-forcefield">forcefield</InputLabel>
          <Select
            id="select-forcefield"
            defaultValue=''
            onChange={
              v => this.setState({ forcefield: v.target.value })
            }>

            {Object.keys(DataForm).map(e => {
              return (<MenuItem key={e} value={e}> {e} </MenuItem>)
            })
            }

          </Select>

          {
            showMoleculeForm()
          }

          <p> Explication : </p>
          <ul>
            <li>Create a new link : Move the node</li>
            <li>Remove : click on a node or a link</li>
            <li>Then download your polymer in json</li>
          </ul>
          <button type="submit" name="download" id="download">
            Json download
          </button>

        </form>
      </div>
    )
  };
}