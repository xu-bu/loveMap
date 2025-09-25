import {LocationData} from "./db"
import type { HistoryState } from 'vue-router'

export interface loveSpotState extends HistoryState {
  loveSpot: LocationData;
}