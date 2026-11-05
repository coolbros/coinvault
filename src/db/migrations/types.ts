import { DatabaseAdapter } from '../client';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseAdapter) => void;
}
