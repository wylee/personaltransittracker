import debounce from "lodash/debounce";

import { bbox as bboxLoadingStrategy } from "ol/loadingstrategy";

import Collection from "ol/Collection";
import Feature from "ol/Feature";
import Geolocation from "ol/Geolocation";
import Map from "ol/Map";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import View from "ol/View";

import OSMSource from "ol/source/OSM";
import TileDebugSource from "ol/source/TileDebug";
import VectorSource from "ol/source/Vector";
import XYZSource from "ol/source/XYZ";

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import GeoJSONFormat from "ol/format/GeoJSON";

import {
  ANIMATION_DURATION,
  API_URL,
  DEBUG,
  GEOGRAPHIC_PROJECTION,
  MAPBOX_ACCESS_TOKEN,
  MAX_ZOOM,
  MIN_ZOOM,
  FEATURE_LAYER_MAX_RESOLUTION,
  USER_LOCATION_ACCURACY_THRESHOLD,
} from "./const";

import { STOP_STYLE, STOP_STYLE_SELECTED, USER_LOCATION_STYLE } from "./styles";
import { transform, transformExtent } from "./utils";
import { Center, ZoomLevel } from "./types";
import OverviewSwitcher from "./OverviewSwitcher";
import { unByKey } from "ol/Observable";

export default class OpenLayersMap {
  listenerKeys: number[];
  baseLayers: TileLayer[];
  baseLayer: any;
  featureLayers: Array<VectorLayer>;
  userLocationLayer: VectorLayer;
  selectedStops: string[];
  map: Map;
  view: View;
  overviewSwitcher: OverviewSwitcher;
  _geolocator: any;

  constructor() {
    const baseLayers: any = [];

    if (DEBUG) {
      baseLayers.push(this.makeDebugLayer("Debug", null, true));
    }

    baseLayers.push(
      this.makeBaseLayer("wylee/ckq4iwptf2wzn17pjnpbh9gsa", "Map", null, !DEBUG),
      this.makeBaseLayer("wylee/cjgpp7kso000c2smgd2hji3j8", "Satellite"),
      this.makeOSMLayer()
    );

    let featureLayers = [
      this.makeFeatureLayer("Stops", "stops", {
        style: STOP_STYLE,
      }),
    ];

    const userLocationLayer = new VectorLayer({
      visible: false,
      source: new VectorSource({
        features: new Collection(),
      }),
    });

    const allLayers = baseLayers.concat(featureLayers);
    allLayers.push(userLocationLayer);

    const map = new Map({
      controls: [],
      layers: allLayers,
      view: new View({
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      }),
    });

    this.listenerKeys = [];
    this.baseLayers = baseLayers;
    this.baseLayer = baseLayers.find((layer) => layer.getVisible());
    this.featureLayers = featureLayers;
    this.userLocationLayer = userLocationLayer;
    this.selectedStops = [];
    this.map = map;
    this.view = map.getView();
    this.overviewSwitcher = new OverviewSwitcher(this, baseLayers);
  }

  initialize(target, overviewMapTarget) {
    this.map.setTarget(target);
    this.overviewSwitcher.initialize(overviewMapTarget, 12);
  }

  dispose() {
    this.map.setTarget(null);
    this.listenerKeys.forEach((key) => unByKey(key));
    this.geolocator.listenerKeys.forEach((key) => unByKey(key));
  }

  addListener(type, listener, once = false) {
    const key = once ? this.map.once(type, listener) : this.map.on(type, listener);
    this.listenerKeys.push(key);
    return key;
  }

  addFeatureListener(type, callback, noFeatureCallback?, onlyLayer?, debounceTime?: number) {
    const map = this.map;
    let listener = (event) => {
      const options = {
        layerFilter: onlyLayer ? (layer) => layer === onlyLayer : undefined,
      };

      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          callback(feature, layer, event);
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
    return this.addListener(type, listener);
  }

  getCoordinateFromPixel(pixel) {
    return this.map.getCoordinateFromPixel(pixel);
  }

  getPixelFromFeature(feature) {
    const coordinates = feature.getGeometry().getCoordinates();
    const pixel = this.map.getPixelFromCoordinate(coordinates);
    return pixel;
  }

  getResolution() {
    return this.view.getResolution();
  }

  getSize() {
    return this.map.getSize();
  }

  getView() {
    return this.view;
  }

  /* Center */

  getCenter(native = true) {
    let center = this.view.getCenter();
    if (!native) {
      center = transform(center);
    }
    return center;
  }

  setCenter(center: Center, zoom?: ZoomLevel, native = true, duration = ANIMATION_DURATION) {
    if (!native) {
      center = transform(center, true);
    }

    const doZoom = typeof zoom !== "undefined";

    return new Promise((resolve, reject) => {
      if (duration && duration > 0) {
        const options = { center, duration, zoom: doZoom ? zoom : undefined };
        const callback = (completed) => (completed ? resolve(this) : reject(this));
        this.view.animate(options, callback);
      } else {
        this.view.setCenter(center);
        if (doZoom) {
          this.view.setZoom(zoom);
        }
        resolve(this);
      }
    });
  }

  /* Extent */

  getExtent(native = true) {
    let extent = this.view.calculateExtent(this.getSize());
    if (!native) {
      extent = transformExtent(extent);
    }
    return extent;
  }

  fitExtent(newExtent, native = true, options: any = {}, duration = ANIMATION_DURATION) {
    if (!native) {
      newExtent = transformExtent(newExtent, true);
    }

    if (!options.size) {
      options.size = this.getSize();
    }

    if (duration && duration > 0) {
      options.duration = duration;
      this.view.fit(newExtent, options);
    } else {
      this.view.fit(newExtent, options);
    }
  }

  /* Layers */

  makeBaseLayer(name, label, shortLabel = null, visible = false) {
    shortLabel = shortLabel || label;
    const source = new XYZSource({
      url: `https://api.mapbox.com/styles/v1/${name}/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    });
    return new TileLayer({ label, shortLabel, source, visible });
  }

  makeOSMLayer(label = "OpenStreetMap", shortLabel = "OSM", visible = false) {
    const source = new OSMSource();
    return new TileLayer({ label, shortLabel, source, visible });
  }

  makeDebugLayer(label, shortLabel, visible = false) {
    const osmSource = new OSMSource();
    const source = new TileDebugSource({
      projection: osmSource.getProjection(),
      tileGrid: osmSource.getTileGrid(),
    });
    shortLabel = shortLabel || label;
    return new TileLayer({ label, shortLabel, source, visible });
  }

  makeFeatureLayer(label, path, options: any = {}) {
    const url = `${API_URL}/${path}/.geojson`;
    const source = new VectorSource({
      format: new GeoJSONFormat(),
      strategy: bboxLoadingStrategy,
      url: (extent) => {
        const bbox = transformExtent(extent).join(",");
        return `${url}?bbox=${bbox}`;
      },
    });
    options.maxResolution = options.maxResolution || FEATURE_LAYER_MAX_RESOLUTION;
    options.projection = options.projection || GEOGRAPHIC_PROJECTION;
    return new VectorLayer({ label, source, ...options });
  }

  setBaseLayer(newLayer) {
    const baseLayers = this.baseLayers;
    const numBaseLayers = baseLayers.length;

    if (typeof newLayer === "string") {
      newLayer = baseLayers.find((layer) => layer.get("label") === newLayer);
    }

    let nextLayerIndex = 0;
    baseLayers.forEach((layer, i) => {
      layer.setVisible(false);
      if (layer === newLayer) {
        nextLayerIndex = (i + 1) % numBaseLayers;
      }
    });

    this.overviewSwitcher.setBaseLayerByIndex(nextLayerIndex);
    this.baseLayer = newLayer;
    this.baseLayer.setVisible(true);
  }

  get nextBaseLayer() {
    return this.overviewSwitcher.baseLayer.get("label");
  }

  getFeatureLayer(label) {
    return this.featureLayers.find((layer) => layer.get("label") === label);
  }

  setSelectedStops(stopIDs) {
    const layer = this.getFeatureLayer("Stops");
    const source = layer.getSource();
    this.selectedStops.forEach((featureID) => {
      const feature = source.getFeatureById(featureID);
      if (feature) {
        feature.setStyle(STOP_STYLE);
      }
    });
    stopIDs.forEach((id) => {
      const featureID = `stop.${id}`;
      const feature = source.getFeatureById(featureID);
      if (feature) {
        this.selectedStops.push(featureID);
        feature.setStyle(STOP_STYLE_SELECTED);
      } else {
        this.map.once("rendercomplete", () => {
          this.setSelectedStops(stopIDs);
        });
      }
    });
  }

  /* Zoom */

  getZoom() {
    return this.view.getZoom();
  }

  /* Geolocation */

  get geolocator() {
    if (!this._geolocator) {
      const geolocator = new Geolocation({
        projection: this.view.getProjection(),
        tracking: true,
        trackingOptions: {
          maximumAge: 2 * 1000,
          enableHighAccuracy: true,
          timeout: 30 * 1000,
        },
      });
      geolocator.listenerKeys = [];
      this._geolocator = geolocator;
    }
    return this._geolocator;
  }

  addGeolocatorListener(type, listener, once = false) {
    const key = once ? this.geolocator.once(type, listener) : this.geolocator.on(type, listener);
    this.geolocator.listenerKeys.push(key);
    return key;
  }

  showUserLocation(userLocation) {
    const layer = this.userLocationLayer;
    const source = layer.getSource();
    const { position, accuracy, accuracyCoords } = userLocation;
    source.clear();
    if (position) {
      const feature = new Feature({
        geometry: new Point(position),
      });
      feature.setStyle(USER_LOCATION_STYLE);
      source.addFeature(feature);
      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }
}