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
  id1: number | null;
  id2: number | null;
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
      id1: null,
      id2: null,
    }
  }

  GetMolFField(jsonformdata: any, ff: string): string[] {
    return jsonformdata[ff];
  }


  render() {
    let forcefield = this.state.forcefield;

    const renderforcfieldform = () => {
      if (forcefield) {
        return <div><p>Add your molecule :</p>

          <Select
            id="moleculeToAdd"
            label="Molecule"
            defaultValue={"this.GetMolFField(DataForm, forcefield)[0]"}
            onChange={v => this.setState({ moleculeToAdd: v.target.value })}
          >
            <option disabled selected>Molecule avaible :</option>

            {this.GetMolFField(DataForm, forcefield).map(e => {
              return (<MenuItem key={e} value={e}> {e} </MenuItem>
              )
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
            onClick={() => this.props.addnode(this.state)}>
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
            onClick={() => this.props.addlink(this.state.id1, this.state.id2)}>
            add link
          </Button>
        </div>
      } else {
        return null;
      }
    }



    return (
      <div>

        <p>Upload your previous polymer</p>

        <input type="file" id="docpicker" accept=".json" />

        <form>
          <div className="container">
            <p>Choose your forcefield :</p>

            <InputLabel id="forcefield">forcefield</InputLabel>
            <Select
              id="forcefield"
              label="forcefield"
              defaultValue={null}
              onChange={ 
                v =>  this.setState({ forcefield: v.target.value })
                }>
              <option disabled selected>Forcefield avaible :</option>
              
              {Object.keys(DataForm).map(e => {
                return (<MenuItem key={e} value={e}> {e} </MenuItem>
                )
              })
              }

            </Select>

            {
              renderforcfieldform()
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
          </div>
        </form >
      </div>
    )
  };
}