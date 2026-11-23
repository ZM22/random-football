export type Position = 'GK'|'LB'|'CB'|'RB'|'CDM'|'CM'|'CAM'|'LW'|'RW'|'ST';
export type Player = { id:string; name:string; nationality:string|null; overall:number|null; position:Position; teamName:string; sourceStatus:'demo'|'verified' };
export type Team = { id:string; name:string; kind:'national'|'club' };
