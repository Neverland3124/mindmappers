export interface Room {
  id: number,
  name: string;
  description: string;
  owner: number; // TODO: change to owner to show private rooms
}
