import { InjectionKey } from "vue";
import { createStore, useStore as baseUseStore, Store } from "vuex";

import axios from "axios";

import { ARRIVALS_URL } from "../const";

type Result = any;

interface Error {
  title: string;
  explanation: string;
  detail?: string;
}

export interface State {
  menuOpen: boolean;
  term: string;
  stops: number[];
  result: Result | null;
  error: Error | null;
  timeoutID: number | null;
}

export const key: InjectionKey<Store<State>> = Symbol();

// XXX: Use this rather than importing useStore from vuex in order to
//      get typing support;
export function useStore(): Store<State> {
  return baseUseStore(key);
}

export const store = createStore<State>({
  strict: process.env.NODE_ENV !== "production",
  state: {
    menuOpen: false,
    term: "",
    stops: [],
    result: null,
    error: null,
    timeoutID: null,
  },
  mutations: {
    openMenu(state) {
      state.menuOpen = true;
    },
    closeMenu(state) {
      state.menuOpen = false;
    },
    toggleMenu(state) {
      state.menuOpen = !state.menuOpen;
    },
    setSearchTerm(state, payload: { term: string }) {
      state.term = payload.term;
    },
    setStops(state, payload: { stops: number[] }) {
      state.stops = payload.stops;
    },
    setSearchState(
      state,
      payload: { term: string; stops?: number[]; error?: Error }
    ) {
      state.term = payload.term;
      state.stops = payload.stops ?? termToStopIDs(payload.term);
      state.error = payload.error ?? null;
    },
    resetSearchState(state) {
      state.term = "";
      state.stops = [];
      state.error = null;
    },
    setError(state, payload: { error: Error }) {
      state.error = payload.error;
    },
  },
  actions: {
    search({ commit }, payload: { term: string }) {
      let { term } = payload;

      if (!term.trim()) {
        commit("setSearchTerm", { term });
        return;
      }

      let stops: number[];

      try {
        stops = termToStopIDs(term);
      } catch (e) {
        commit("setSearchState", {
          term,
          stops: [],
          error: {
            title: e.name,
            explanation: e.message,
            detail: e.detail,
          },
        });
        return;
      }

      term = stops.join(", ");
      commit("setSearchState", { term, stops });

      return axios
        .get(ARRIVALS_URL, {
          params: { q: stops.join(",") },
        })
        .then((response) => {
          console.log(response);
          const result = response.data;
          const { count } = result;
          if (count) {
            console.log("Num arrivals:", count);
          }
        })
        .catch((error) => {
          console.error(error);
          if (axios.isCancel(error)) {
            return;
          }
        });
    },
  },
  modules: {},
});

function termToStopIDs(term: string): number[] {
  const trimmed = term.replace(/^[ ,]+/, "").replace(/[ ,]+$/, "");
  if (!trimmed) {
    return [];
  }
  const items = trimmed.split(",");
  const stops: number[] = [];
  const bad: string[] = [];
  for (const item of items) {
    const stopID = parseInt(item.trim(), 10);
    if (isNaN(stopID)) {
      bad.push(item);
    } else if (stops.indexOf(stopID) === -1) {
      stops.push(stopID);
    }
  }
  if (bad.length) {
    throw new InvalidStopIDError(bad);
  }
  stops.sort((a, b) => a - b);
  return stops;
}

class InvalidStopIDError {
  name = "Bad Stop ID";
  stopIDs: string[];
  message: string;
  detail = "TriMet stop IDs are numbers like 4, 17, etc";

  constructor(stopIDs: string[]) {
    const ess = stopIDs.length === 1 ? "" : "s";
    const verb = stopIDs.length === 1 ? "is" : "are";
    const string = stopIDs.join(", ");
    this.stopIDs = stopIDs;
    this.message = `The following stop ID${ess} ${verb} not valid: ${string}`;
  }

  toString() {
    return this.message;
  }
}
