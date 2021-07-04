<template>
  <div id="map">
    <div
      className="controls bottom-left column"
      @contextmenu="
        (event) => {
          event.stopPropagation();
        }
      "
    >
      <div className="mapbox-wordmark">
        <a
          href="https://www.mapbox.com/about/maps/"
          title="Map tiles and styling provided by Mapbox"
        >
          <img :src="MAPBOX_WORDMARK_IMAGE_DATA" height="18" alt="Mapbox" />
        </a>
      </div>

      <!-- overview map/switcher -->
      <div class="overview-map">
        <div className="label">Layer</div>
      </div>
    </div>

    <div class="controls bottom-right column">
      <button
        type="button"
        title="Find my location"
        class="material-icons"
        @click="map.setInitialCenterAndZoom()"
      >
        my_location
      </button>

      <button
        title="Zoom to full extent"
        class="material-icons hidden-xs"
        @click="map.setInitialCenterAndZoom()"
      >
        public
      </button>

      <button
        type="button"
        title="Zoom in"
        class="material-icons"
        @click="map.zoomIn()"
      >
        add
      </button>

      <button
        type="button"
        title="Zoom out"
        class="material-icons"
        @click="map.zoomOut()"
      >
        remove
      </button>
    </div>

    <div id="attributions" @contextmenu="(event) => event.stopPropagation()">
      <div className="mapbox-copyright">
        © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>
      </div>

      <div className="osm-copyright">
        © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
      </div>

      <div className="mapbox-improve">
        <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { onMounted, onUnmounted } from "vue";

import { MAPBOX_WORDMARK_IMAGE_DATA } from "./const";
import Map from "./map";

export default {
  name: "Map",
  setup(): { map: Map; MAPBOX_WORDMARK_IMAGE_DATA: string } {
    const map = new Map([0, 0], 4);
    onMounted(() => {
      map.setTarget("map");
    });
    onUnmounted(() => {
      map.cleanup();
    });
    return { map, MAPBOX_WORDMARK_IMAGE_DATA };
  },
};
</script>

<style scoped lang="scss">
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#map {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  background-color: lighten(lightseagreen, 50%);
}

#map > .controls {
  position: absolute;
  z-index: 1;

  button {
    @include floating-element();
  }

  &.row {
    display: flex;
    flex-direction: row;
    margin: 0;
    > * {
      margin: 0;
      margin-left: $quarter-standard-spacing;
    }
  }

  &.column {
    display: flex;
    flex-direction: column;
    margin: 0;
    > * {
      margin: 0;
      margin-top: $quarter-standard-spacing;
    }
  }

  &.bottom-right {
    bottom: $standard-spacing;
    right: $standard-spacing;

    @media (max-width: $xs-width - 1px) {
      bottom: $quarter-standard-spacing;
      right: $quarter-standard-spacing;
    }
  }

  &.bottom-left {
    bottom: $standard-spacing;
    left: $standard-spacing;

    .overview-map {
      @include floating-element();
      @include hidden-sm();

      position: relative;

      width: 128px;
      height: 128px;

      background-color: white;
      border: 2px solid lightgray;
      border-radius: $border-radius;
      cursor: pointer;
      margin-bottom: $quarter-standard-spacing;

      .label {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        margin: 0;
        padding: 2px;
        z-index: 10;
        color: black;
        background-color: rgba(255, 255, 255, 0.5);
        font-weight: bold;
        line-height: 1;
        text-align: center;
      }
    }
    @media (max-width: $sm-width - 1px) {
      bottom: $standard-spacing + 20px;
    }

    @media (max-width: $xs-width - 1px) {
      left: $quarter-standard-spacing;
      bottom: $half-standard-spacing + 16px;
    }
  }
}

#map > #attributions {
  @include floating-element();
  @include hidden-sm();

  position: absolute;
  bottom: $standard-spacing;
  right: $standard-spacing + $half-standard-spacing + 40px;
  z-index: 12;

  background-color: rgba(255, 255, 255, 0.75);

  font-size: 14px;
  line-height: 1;
  padding: 8px 4px;
  white-space: nowrap;

  .mapbox-improve a {
    font-weight: bold;
  }

  div {
    display: inline-block;
    margin-right: $quarter-standard-spacing;
    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
