import {SimulationNodeDatum, SimulationLinkDatum} from 'd3';

export interface FormState {
    forcefield: string;
    moleculeToAdd: string;
    numberToAdd: number;
  }

export interface SimulationNode extends SimulationNodeDatum {
  resname : string,
  seqid : number,
  links? :SimulationNode[],
  id: number|string
  x? : number,
  y? : number,
  fx? : number|null,
  fy? : number|null,
  group? : number,
}

export interface SimulationLink extends SimulationNodeDatum{
  source: SimulationNode,
  target: SimulationNode
}

export interface SimulationGroup extends SimulationNodeDatum{
  id : number ,
  nodes : SimulationNode[]
}