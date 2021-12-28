import * as React from "react";
import * as ReactDOM from "react-dom";
import GeneratorManager from './components/GeneratorManager';
import Header from './components/header';
ReactDOM.render(
  <div>
    <Header />
      <GeneratorManager />
    </div>,
  document.getElementById("root")
);