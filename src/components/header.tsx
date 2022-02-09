import * as React from "react";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from "@mui/material/Typography";

export default class Header extends React.Component {

    render() {
        return (
            <AppBar position="static">
                <Toolbar variant="regular">
                    <Typography> <h1>Polymer Generator</h1> </Typography>
                </Toolbar>
            </AppBar>
        )
    }
}