<template>
  <div id="menu" :style="{ right: menuOpen ? 0 : 'auto' }">
    <button
      type="button"
      :title="buttonTitle"
      class="material-icons"
      @click="toggleMenu()"
    >
      <template v-if="menuOpen">close</template>
      <template v-else>menu</template>
    </button>

    <div class="menu-backdrop" @click="closeMenu()" v-if="menuOpen" />

    <ul class="menu" v-if="menuOpen">
      <li class="title">MyStops</li>

      <li>
        <a href="/" class="regular-link">
          <span class="material-icons">home</span>
          <span>Home</span>
        </a>
      </li>

      <li class="section-heading">
        <span>Links</span>
      </li>

      <li>
        <a href="https://trimet.org/" class="regular-link">
          <span class="material-icons">link</span>
          <span>TriMet</span>
        </a>
      </li>

      <li class="section-heading">
        <span>Info</span>
      </li>

      <li class="info">
        <div>
          <p>
            Arrival data provided by
            <a href="https://developer.trimet.org/">TriMet</a>.
          </p>
        </div>
      </li>

      <li class="info">
        <div>
          <p>
            Map data &copy; <a href="https://mapbox.com/">Mapbox</a> &
            <a href="https://openstreetmap.org/">OpenStreetMap</a>
          </p>
        </div>
      </li>

      <li class="info">
        <div>
          <p>
            This application is currently in the initial stages of development
            and <i>should not</i> be considered a reliable source for TriMet
            arrival times or any other information. Arrival times and other
            information <i>should</i> be verified via
            <a href="https://trimet.org/">TriMet's official TransitTracker™</a>
            or by other means.
          </p>
          <p>
            Contact: <a href="mailto:contact@mystops.io">contact@mystops.io</a>
          </p>
          <p>&copy; 2018, 2021 mystops.io</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapMutations } from "vuex";

export default defineComponent({
  name: "Menu",
  computed: {
    ...mapState(["menuOpen"]),
    ...mapState({
      buttonTitle: (state: any) => {
        return state.menuOpen ? "Close menu" : "Open menu";
      },
    }),
  },
  methods: {
    ...mapMutations(["closeMenu", "toggleMenu"]),
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins.scss";
@import "../assets/styles/variables.scss";

#menu {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 40;

  > button {
    position: absolute;
    top: $standard-spacing;
    left: $standard-spacing;
    z-index: 3;

    @media (max-width: $xs-width - 1px) {
      top: $quarter-standard-spacing;
      left: $quarter-standard-spacing;
    }
  }

  > div.menu-backdrop,
  ul.menu {
    animation: fade-in 0.5s;
  }

  > div.menu-backdrop {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.5);
  }

  > ul.menu {
    @include menu();

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    overflow: auto;
    z-index: 2;
    width: $menu-width;

    > li.title {
      @include title();
      text-align: right;

      &:hover {
        background-color: white;
      }
    }

    @media (max-width: $xs-width - 1px) {
      right: 0;
      width: auto;
    }
  }
}
</style>
