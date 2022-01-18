import {SimulationNodeDatum, SimulationLinkDatum} from 'd3';

export interface FormState {
    forcefield: string;
    moleculeToAdd: string;
    numberToAdd: number;
  }

export interface SimulationNode extends SimulationNodeDatum {
  resname : string,
  seqid : number,
  id: number|string
  x? : number,
  y? : number,
  fx? : number|null,
  fy? : number|null
}

export interface SimulationLink extends SimulationNodeDatum{
  source: SimulationNode,
  target: SimulationNode
}