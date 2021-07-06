<template>
  <ul id="map-context-menu" v-if="open" :style="{ ...style }">
    <li>
      <a href="" @click.prevent="centerMap">Center map here</a>
    </li>
    <li>
      <a href="">Zoom in here</a>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "../store";
import Map from "./map";

export default defineComponent({
  name: "MapContextMenu",
  props: {
    map: {
      type: Map,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const open = computed(() => store.state.mapContextMenu.open);
    const style = computed(() => {
      return getStyle(props.map, store.state.mapContextMenu);
    });
    function centerMap() {
      const { x, y } = store.state.mapContextMenu;
      const center = props.map.getCoordinateFromPixel([x, y]);
      props.map.setCenter(center);
    }
    return { open, style, centerMap };
  },
});

function getStyle(map: Map, state: { open: boolean; x: number; y: number }) {
  if (!state.open) {
    return {
      display: "none",
      top: "auto",
      right: 0,
      bottom: 0,
      left: "auto",
    };
  }

  const { x, y } = state;
  const [containerWidth, containerHeight] = map.getSize() || [0, 0];
  const threshold = 200;

  let top = `${y}px`;
  let right = "auto";
  let bottom = "auto";
  let left = `${x}px`;

  if (containerWidth - x < threshold) {
    left = "auto";
    right = `${containerWidth - x}px`;
  }

  if (containerHeight - y < threshold) {
    top = "auto";
    bottom = `${containerHeight - y}px`;
  }

  return { display: "block", top, right, bottom, left };
}
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#map-context-menu {
  @include menu(
    $item-border: none,
    $item-padding: (
      $quarter-standard-spacing $half-standard-spacing,
    ),
    $item-link-color: $text-color
  );

  > li:first-child {
    border-top: 1px solid $menu-item-border-color;
  }

  position: absolute;
  z-index: 13;

  animation: fade-in 0.75s;
}
</style>
