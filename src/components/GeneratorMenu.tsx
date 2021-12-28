import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import formstate from "./form"

interface propsmenu {
  addnode : (arg0: resform) => void,
}

type resform = {
  forcefield: string;
  moleculeToAdd: string;
  numberToAdd: number;
}

export default class GeneratorMenu extends React.Component<propsmenu ,formstate > {

  constructor(props : propsmenu) {
    // Required step: always call the parent class' constructor
    super(props);

    // Set the state directly. Use props if necessary.
    this.state = {
      forcefield: "martini3",
      moleculeToAdd: "glucose",
      numberToAdd: 1
    }
    }
  
  // ffprop: { [name: string]: forcefieldprop } = {};
  // martini3 = {
  //   moleculeavaible: ['glucose', 'fructose', 'galactose'],

  // };
  // martini2 = {
  //   moleculeavaible: ['alanine', 'leucine', 'trucine'],
  // };

  listff = [
    "martini3",
    "parmbsc1",
    "martini3_beta",
    "2016H66",
    "oplsaaLigParGen",
    "gromos53A6",
    "martini2",
  ];

  listmol = [
    "Glucose",
    "Fructose",
    "Galactose"
  ]

  render() {
    return (
      <div>

        <p>Upload your previous polymer</p>

        <input type="file" id="docpicker" accept=".json" />

        <form>
          <div className="container">
            <p>Choose your forcefield :</p>

            <Select
              id="forcefield"
              label="forcefield"
              defaultValue={this.listff[0]}
              onChange={v => this.setState({ forcefield: v.target.value })}>
              <option disabled selected>Forcefield avaible :</option>

              {this.listff.map(e => {
                return (<MenuItem key={e} value={e}> {e} </MenuItem>
                )
              })
              }

            </Select>

          <p>Add your molecule :</p>

          <Select
            id="moleculeToAdd"
            label="Molecule"
            defaultValue={this.listmol[0]}
            onChange={v => this.setState({ moleculeToAdd: v.target.value })}
          >
            <option disabled selected>Molecule avaible :</option>

            {this.listmol.map(e => {
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
            id="add"
            variant="contained"
            onClick={() => this.props.addnode(this.state)}>
            add
          </Button>

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
    )};
}