import OLMap from "ol/Map";
import View from "ol/View";

import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import OSMSource from "ol/source/OSM";
import TileDebugSource from "ol/source/TileDebug";
import VectorSource from "ol/source/Vector";
import XYZSource from "ol/source/XYZ";

import GeoJSONFormat from "ol/format/GeoJSON";

import { EventsKey } from "ol/events";
import { bbox as bboxLoadingStrategy } from "ol/loadingstrategy";
import { transformExtent } from "ol/proj";
import { unByKey } from "ol/Observable";

import {
  DEBUG,
  API_URL,
  FEATURE_LAYER_MAX_RESOLUTION,
  GEOGRAPHIC_PROJECTION,
  NATIVE_PROJECTION,
} from "./const";

export default class Map {
  private olMap: OLMap;
  private view: View;
  private initialCenter: number[];
  private initialZoom: number;
  private baseLayers: BaseLayer[];
  private animationDuration = 250;
  private listenerKeys: EventsKey[] = [];

  constructor(center: number[], zoom: number) {
    this.initialCenter = center;
    this.initialZoom = zoom;

    this.view = new View({
      center,
      zoom,
      minZoom: 4,
      maxZoom: 19,
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

    this.olMap = new OLMap({
      controls: [],
      layers: this.baseLayers,
      view: this.view,
    });
  }

  on(type: string, listener: (event: Event) => any): EventsKey {
    const key = this.olMap.on(type, listener) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  once(type: string, listener: (event: Event) => any): EventsKey {
    const key = this.olMap.once(type, listener) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  setTarget(target: string): void {
    this.olMap.setTarget(target);
  }

  cleanup(): void {
    this.olMap.setTarget(undefined);
    this.listenerKeys.forEach((key) => {
      unByKey(key);
    });
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
}

function makeMapboxLayer(
  name: string,
  label: string,
  shortLabel?: string,
  visible = false
) {
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
) {
  const source = new OSMSource();
  const layer = new TileLayer({ source, visible });
  layer.set("label", label);
  layer.set("shortLabel", shortLabel);
  return layer;
}

function makeDebugLayer(visible = true) {
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

function makeFeatureLayer(label: string, path: string, options: any = {}) {
  const url = `${API_URL}/${path}/.geojson`;
  const source = new VectorSource({
    format: new GeoJSONFormat(),
    strategy: bboxLoadingStrategy,
    url: (extent) => {
      const bbox = transformExtent(
        extent,
        NATIVE_PROJECTION,
        GEOGRAPHIC_PROJECTION
      ).join(",");
      return `${url}?bbox=${bbox}`;
    },
  });
  options.maxResolution = options.maxResolution || FEATURE_LAYER_MAX_RESOLUTION;
  options.projection = options.projection || GEOGRAPHIC_PROJECTION;
  return new VectorLayer({ label, source, ...options });
}
