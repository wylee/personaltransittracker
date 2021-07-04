import OLMap from "ol/Map";
import View from "ol/View";

import TileLayer from "ol/layer/Tile";

import XYZ from "ol/source/XYZ";

import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

const BASE_MAP_URL =
  "https://basemap.nationalmap.gov/" +
  "/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}";

export default class Map {
  private olMap: OLMap;
  private view: View;
  private initialCenter: number[];
  private initialZoom: number;
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
    this.olMap = new OLMap({
      controls: [],
      layers: [
        new TileLayer({
          source: new XYZ({
            url: BASE_MAP_URL,
          }),
        }),
      ],
      view: this.view,
    });
  }

  on(type: string, listener: (event: any) => any) {
    const key = this.olMap.on(type, listener) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  once(type: string, listener: (event: any) => any) {
    const key = this.olMap.once(type, listener) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  setTarget(target: string) {
    this.olMap.setTarget(target);
  }

  cleanup() {
    this.olMap.setTarget(undefined);
    this.listenerKeys.forEach((key) => {
      unByKey(key);
    });
  }

  setCenter(center: number[]) {
    this.view.animate({ center, duration: this.animationDuration });
  }

  setCenterAndZoom(center: number[], zoom: number) {
    this.view.animate({ center, zoom, duration: this.animationDuration });
  }

  setInitialCenterAndZoom() {
    this.setCenterAndZoom(this.initialCenter, this.initialZoom);
  }

  setZoom(zoom: number) {
    this.view.animate({ zoom, duration: this.animationDuration });
  }

  zoomIn() {
    const zoom = this.view.getZoom();
    if (typeof zoom !== "undefined") {
      const maxZoom = this.view.getMaxZoom();
      if (zoom < maxZoom) {
        this.setZoom(zoom + 1);
      }
    }
  }

  zoomOut() {
    const zoom = this.view.getZoom();
    if (typeof zoom !== "undefined") {
      const minZoom = this.view.getMinZoom();
      if (zoom > minZoom) {
        this.setZoom(zoom - 1);
      }
    }
  }
}
