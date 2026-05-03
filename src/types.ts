export interface Point {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  username: string;
  snake: Point[];
  direction: Point;
  score: number;
  color: string;
  isAlive: boolean;
}

export interface PowerUp {
  type: string;
  pos: Point;
}

export interface Room {
  id: string;
  players: { [id: string]: Player };
  food: Point;
  powerUp: PowerUp | null;
  status: "waiting" | "playing" | "gameover";
}

export const GRID_SIZE = 20;
