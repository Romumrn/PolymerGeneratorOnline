import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Grain from "@mui/icons-material/Grain";
import Insights from "@mui/icons-material/Insights";
import { FormState } from './SimulationType'
import Typography from "@mui/material/Typography";
import Warning from "./warning";

interface propsmenu {
  addnodeFromJson: (jsondata: JSON) => void,
  addnode: (arg0: FormState) => void,
  addlink: (arg1: any, arg2: any) => void,
  dataForceFieldMolecule: {} | JSON,
}

interface GeneratorMenuState extends FormState {
  id1: string | undefined;
  id2: string | undefined;
  Warningmessage: string;
}

export default class GeneratorMenu extends React.Component<propsmenu, GeneratorMenuState> {

  constructor(props: propsmenu) {
    // Required step: always call the parent class' constructor
    super(props);

    // Set the state directly. Use props if necessary.
    this.state = {
      forcefield: "",
      moleculeToAdd: "",
      numberToAdd: 1,
      id1: undefined,
      id2: undefined,
      Warningmessage: "",
    }
  }

  GetMolFField(jsonformdata: any, ff: string): string[] {
    return jsonformdata[ff];
  }

  explosion(): void {
    console.log("Boom");
    if (this.state.forcefield == null) {
      this.setState({ Warningmessage: "Field Forcefield null" })
    }
    else if (this.state.moleculeToAdd == null) {
      this.setState({ Warningmessage: "Field Molecule null" })
    }
    else {
      this.props.addnode({ forcefield: this.state.forcefield, moleculeToAdd: this.state.moleculeToAdd, numberToAdd: 1000 })
    }
  }

  CheckNewMolecule(): void {
    if (this.state.forcefield === '') {
      this.setState({ Warningmessage: "Field Forcefield null" })
    }
    else if (this.state.moleculeToAdd === '') {
      this.setState({ Warningmessage: "Field Molecule null" })
      //this.props.addnode
    }
    else {
      this.props.addnode(this.state)
    }
  }

  CheckNewLink(idLink1: string | undefined, idLink2: string | undefined): void {
    // check undefined value : 

    if ((typeof (idLink1) == 'undefined') || (typeof (idLink2) == 'undefined')) {
      this.setState({ Warningmessage: "Problem link : id number undefined" })
    }
    else {
      this.props.addlink(idLink1, idLink2)
    }
  }

  handleUpload = (selectorFiles: FileList) => {
    if (selectorFiles.length === 1) {
      let file = selectorFiles[0]
      if (file.type && !file.type.startsWith('application/json')) {
        this.setState({ Warningmessage: 'File is not Json. ' + file.type });
        return;
      }
      let reader = new FileReader();
      reader.onload = (event: any) => {
        let obj = JSON.parse(event.target.result);
        this.props.addnodeFromJson(obj);
      }
      reader.readAsText(file);
    }
    else {
      this.setState({ Warningmessage: "Only one files should be upload" })
      console.log(selectorFiles)
    }

  }


  render() {

    let forcefield = this.state.forcefield;

    const showMoleculeForm = () => {
      if (forcefield) {

        return <div>
          <Typography>Upload your previous polymer</Typography>


          <Button
            variant="contained"
            component="label"
          >
            Upload File
            <input
              onChange={(e: any) => this.handleUpload(e.target.files)}
              type="file"
              hidden
            />
          </Button>


          <Typography variant="h4" > Or  </Typography>

          <Typography> Add your molecule : </Typography>

          <Select
            id="moleculeToAdd"
            label="Molecule"
            variant="outlined"
            defaultValue={''}
            onChange={v => this.setState({ moleculeToAdd: v.target.value })}
          >
            {this.GetMolFField(this.props.dataForceFieldMolecule, forcefield).map(e => {
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
            endIcon={<Grain />}
            id="addmol"
            variant="contained"
            onClick={() => this.CheckNewMolecule()}>
            add
          </Button>

          <Typography>Add a new link : </Typography>

          <TextField
            label="id1"
            type="number"
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            value={this.state.id1}
            onChange={v => this.setState({ id1: v.target.value })}
            variant="outlined"
          />
          <TextField
            label="id2"
            type="number"
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            value={this.state.id2}
            onChange={v => this.setState({ id2: v.target.value })}
            variant="outlined"
          />

          <Button
            endIcon={<Insights />}
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
        {this.props.dataForceFieldMolecule === {} ? (
          <Typography   >
            Loading ...
          </Typography>
        ) :
          (<form>
            <Typography  >
              Choose your forcefield :
            </Typography>

            <InputLabel id="select-forcefield">forcefield</InputLabel>
            <Select
              id="select-forcefield"
              defaultValue={""}
              onChange={
                v => this.setState({ forcefield: v.target.value })
              }>

              {Object.keys(this.props.dataForceFieldMolecule).map(e => {
                return (<MenuItem key={e} value={e}> {e} </MenuItem>)
              })
              }

            </Select>

            {
              showMoleculeForm()
            }


            <Typography component={'div'}>

              <ul>
                <li>Create a new link : Move the node</li>
                <li>Remove : click on a node or a link</li>
                <li>Then download your polymer in json</li>
              </ul>
            </Typography>

            <Warning message={this.state.Warningmessage} close={() => { this.setState({ Warningmessage: "" }) }}></Warning>

            <Button id="explosion" variant="contained" color="error" endIcon={<Grain />} onClick={() => this.explosion()}>
              Boom
            </Button>

          </form>
          )}
      </div>
    )
  };
}