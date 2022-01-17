
export interface FormState {
    forcefield: string;
    moleculeToAdd: string;
    numberToAdd: number;
  }

export interface SimulationNode{
  resname : string,
  seqid : number,
  id: number|string
  x? : number,
  y? : number,
  fx? : number|null,
  fy? : number|null
}

export interface SimulationLink {
  source: SimulationNode,
  target: SimulationNode
}