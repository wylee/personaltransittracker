import { createStore } from "vuex";

export default createStore({
  state: {
    menuOpen: false,
    searchTerm: "",
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
      state.searchTerm = payload.term;
    },
  },
  actions: {},
  modules: {},
});
