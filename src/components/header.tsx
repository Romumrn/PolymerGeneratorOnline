import * as React from "react";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

export default class Header extends React.Component {

    render() {
        return (
            <AppBar position="static">
                <Toolbar variant="regular">
                    <h1>Polymer Generator</h1>
                </Toolbar>
            </AppBar>
        )
    }
}