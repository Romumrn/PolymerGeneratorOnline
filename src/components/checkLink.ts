import { SimulationNode } from './Form'

export function checkLink(node1: SimulationNode, node2: SimulationNode) {
    console.log( "create link ?" );
    console.log( node1.id , node1.links);
    console.log( node2.id , node2.links);
    if ( (node1.links === undefined ) || (node2.links === undefined) ) return true ;
    else if (node1.links!.length >= 3) {
        alert("Node number #"+node1.id+"  too many links ");
        return false ;
    } 
    else if (node2.links!.length >= 3) {
        alert("Node number #"+node2.id+"  too many links ");
        return false ;}
    else return true ;
}
