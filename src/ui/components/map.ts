import debounce from "lodash/debounce";

import OLMap from "ol/Map";
import View from "ol/View";

import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";

import OSMSource from "ol/source/OSM";
import TileDebugSource from "ol/source/TileDebug";
import VectorSource from "ol/source/Vector";
import VectorTileSource from "ol/source/VectorTile";
import XYZSource from "ol/source/XYZ";

import Feature from "ol/Feature";

import MVTFormat from "ol/format/MVT";

import Collection from "ol/Collection";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

import { DEBUG, API_URL, FEATURE_LAYER_MAX_RESOLUTION } from "../const";

import { STOP_STYLE } from "./map-styles";

type OnFeatureCallback = (
  map: Map,
  feature: Feature,
  pixel: number[],
  layer: BaseLayer,
  event: any
) => any;

type NoFeatureCallback = (event: Event) => any;

export default class Map {
  private readonly map: OLMap;
  private readonly view: View;
  private readonly layers: BaseLayer[];
  private readonly baseLayers: TileLayer[];
  private readonly stopsLayer: VectorTileLayer;
  private readonly userLocationLayer: VectorLayer;
  private listenerKeys: EventsKey[] = [];

  constructor(
    private initialCenter: number[] = [-13655274.508685641, 5704240.981993447],
    private initialZoom: number = 14,
    private minZoom: number = 4,
    private maxZoom: number = 19,
    private animationDuration: number = 250
  ) {
    this.view = new View({
      center: initialCenter,
      zoom: initialZoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      constrainResolution: true,
    });

    this.baseLayers = [
      makeMapboxLayer(
        "wylee/ckq4iwptf2wzn17pjnpbh9gsa",
        "Map",
        undefined,
        !DEBUG
      ),
      makeMapboxLayer("wylee/cjgpp7kso000c2smgd2hji3j8", "Satellite"),
      makeOSMLayer(),
    ];

    if (DEBUG) {
      this.baseLayers.unshift(makeDebugLayer());
    }

    this.stopsLayer = makeMVTLayer("Stops", "stops/mvt", {
      visible: true,
      style: STOP_STYLE,
    });

    this.userLocationLayer = new VectorLayer({
      visible: false,
      source: new VectorSource({
        features: new Collection(),
      }),
    });

    this.layers = [...this.baseLayers, this.stopsLayer, this.userLocationLayer];

    this.map = new OLMap({
      controls: [],
      layers: this.layers,
      view: this.view,
    });

    // TODO: Add/remove stop ID to/from list and search
    this.onFeature(
      "click",
      (map, feature, pixel) => {
        console.log(feature, pixel);
      },
      undefined,
      this.stopsLayer
    );

    // TODO: Show/hide stop info
  }

  on(type: string, listener: (event: Event) => any): EventsKey {
    const key = this.map.on(type, listener) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  once(type: string, listener: (event: Event) => any): EventsKey {
    const key = this.map.once(type, listener) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  onFeature(
    type: string,
    featureCallback: OnFeatureCallback,
    noFeatureCallback?: NoFeatureCallback,
    onlyLayer?: BaseLayer,
    debounceTime?: number
  ): EventsKey {
    const map = this.map;
    let listener = (event: any) => {
      const pixel = event.pixel;
      const options = {
        layerFilter: onlyLayer
          ? (layer: any) => layer === onlyLayer
          : undefined,
      };
      const feature = map.forEachFeatureAtPixel(
        pixel,
        (feature: any, layer: any) => {
          featureCallback(this, feature, pixel, layer, event);
          return feature;
        },
        options
      );
      if (!feature && noFeatureCallback) {
        noFeatureCallback(event);
      }
    };
    if (debounceTime) {
      listener = debounce(listener, debounceTime);
    }
    return this.on(type, listener);
  }

  setTarget(target: string): void {
    this.map.setTarget(target);
  }

  cleanup(): void {
    this.map.setTarget(undefined);
    this.listenerKeys.forEach((key) => {
      unByKey(key);
    });
  }

  getSize(): number[] {
    return this.map.getSize() ?? [0, 0];
  }

  setCenter(center: number[]): void {
    this.view.animate({ center, duration: this.animationDuration });
  }

  setCenterAndZoom(center: number[], zoom: number): void {
    this.view.animate({ center, zoom, duration: this.animationDuration });
  }

  setInitialCenterAndZoom(): void {
    this.setCenterAndZoom(this.initialCenter, this.initialZoom);
  }

  setZoom(zoom: number): void {
    this.view.animate({ zoom, duration: this.animationDuration });
  }

  zoomIn(): void {
    const zoom = this.view.getZoom();
    if (typeof zoom !== "undefined") {
      const maxZoom = this.view.getMaxZoom();
      if (zoom < maxZoom) {
        this.setZoom(zoom + 1);
      }
    }
  }

  zoomOut(): void {
    const zoom = this.view.getZoom();
    if (typeof zoom !== "undefined") {
      const minZoom = this.view.getMinZoom();
      if (zoom > minZoom) {
        this.setZoom(zoom - 1);
      }
    }
  }

  getLayer(label: string): BaseLayer {
    const layer = this.layers.find((layer) => layer.get("label") === label);
    if (!layer) {
      throw new Error();
    }
    return layer;
  }
}

function makeMapboxLayer(
  name: string,
  label: string,
  shortLabel?: string,
  visible = false
): TileLayer {
  const accessToken = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
  const source = new XYZSource({
    url: `https://api.mapbox.com/styles/v1/${name}/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`,
  });
  const layer = new TileLayer({ source, visible });
  shortLabel = shortLabel || label;
  layer.set("label", label);
  layer.set("shortLabel", shortLabel);
  return layer;
}

function makeOSMLayer(
  label = "OpenStreetMap",
  shortLabel = "OSM",
  visible = false
): TileLayer {
  const source = new OSMSource();
  const layer = new TileLayer({ source, visible });
  layer.set("label", label);
  layer.set("shortLabel", shortLabel);
  return layer;
}

function makeDebugLayer(visible = true): TileLayer {
  const osmSource = new OSMSource();
  const source = new TileDebugSource({
    projection: osmSource.getProjection(),
    tileGrid: osmSource.getTileGrid(),
  });
  const layer = new TileLayer({ source, visible });
  layer.set("label", "Debug");
  layer.set("shortLabel", "Debug");
  return layer;
}

function makeMVTLayer(
  label: string,
  path: string,
  options: any = {}
): VectorTileLayer {
  const url = `${API_URL}/${path}/{z}/{x}/{y}`;
  const source = new VectorTileSource({
    url,
    format: new MVTFormat(),
  });
  options.maxResolution = options.maxResolution || FEATURE_LAYER_MAX_RESOLUTION;
  const layer = new VectorTileLayer({ source, ...options });
  layer.set("label", label);
  return layer;
}
