import L from "leaflet";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import icon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import type { GeoJsonPoint, MapsDataDocument } from "../api/mapsData";
import { useMapsData } from "../hooks/useMapsData";

type LatLng = L.LatLngTuple;

const DEFAULT_CENTER: LatLng = [20.5937, 78.9629]; // India
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 9;
const PAGE_SIZE = 25;

function asLatLng(doc: MapsDataDocument): LatLng {
  const [lng, lat] = doc.geometry.coordinates;
  return [lat, lng];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

// Stored as GeoJSON [lng, lat]; humans read "lat, lng".
function formatCoordinates(geometry: GeoJsonPoint): string {
  const [lng, lat] = geometry.coordinates;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Brand palette: teal for selection, forest moss + warm ochre for categories.
const SELECTED_PIN_COLOR = "#0B6E66";
const FALLBACK_PIN_COLOR = "#73706C";
const CATEGORY_PIN_COLORS: Record<string, string> = {
  "National Park": "#3D6B4F",
  "Wildlife Sanctuary": "#AB863F",
};

function pinColorForCategory(category: string): string {
  return CATEGORY_PIN_COLORS[category] ?? FALLBACK_PIN_COLOR;
}

function pinSvg(height: number, fill: string): string {
  const width = Math.round(height * (2 / 3));
  return `<svg width="${width}" height="${height}" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 24 12 24s12-15.5 12-24C24 5.373 18.627 0 12 0z" fill="${fill}" stroke="#F6F4F1" stroke-width="1.5" stroke-opacity="0.9"/>
    <circle cx="12" cy="12" r="4.5" fill="#F6F4F1" fill-opacity="0.95"/>
  </svg>`;
}

/**
 * The selected pin is larger and carries a soft teal glow so it reads as
 * "highlighted" at a glance alongside the selected results row.
 */
function createPinIcon(fill: string, isSelected: boolean): L.DivIcon {
  const height = isSelected ? 46 : 34;
  const width = Math.round(height * (2 / 3));
  const glow = isSelected
    ? "filter: drop-shadow(0 0 8px rgba(11,110,102,0.55)) drop-shadow(0 2px 4px rgba(47,43,40,0.28));"
    : "filter: drop-shadow(0 2px 4px rgba(47,43,40,0.22));";
  const html = `<div style="${glow}">${pinSvg(height, fill)}</div>`;
  return L.divIcon({
    html,
    className: "wb-map-pin",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 6],
  });
}

// DivIcon instances are reused across markers, so cache by color + state.
const pinIconCache = new Map<string, L.DivIcon>();

function getPinIcon(fill: string, isSelected: boolean): L.DivIcon {
  const key = `${fill}:${isSelected ? "1" : "0"}`;
  const cached = pinIconCache.get(key);
  if (cached) return cached;
  const icon = createPinIcon(fill, isSelected);
  pinIconCache.set(key, icon);
  return icon;
}

function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:rgba(11,110,102,0.78);color:#F6F4F1;font-weight:700;font-size:13px;border:2.5px solid rgba(246,244,241,0.88);box-shadow:0 2px 8px rgba(47,43,40,0.22);font-family:'Nunito',sans-serif;">${formatNumber(count)}</div>`;
  return L.divIcon({
    html,
    className: "wb-map-cluster",
    iconSize: L.point(size, size, true),
  });
}

/**
 * Renders a labelled row of pill-style tags (e.g. wildlife or flora). Flora
 * names are scientific, so they read better italicised. Renders nothing when
 * the list is empty so cards stay compact for sparsely-documented sites.
 */
function TagList({
  label,
  items,
  italic = false,
}: {
  label: string;
  items: string[];
  italic?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold text-wildbook-text">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-full bg-[#0B6E66]/8 px-2 py-0.5 text-[11px] leading-tight text-[#2F2B28] ${
              italic ? "italic" : ""
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function MapFiltersPanel({
  query,
  category,
  categories,
  resultCount,
  showLegend,
  onQueryChange,
  onCategoryChange,
  onReset,
}: {
  query: string;
  category: string;
  categories: string[];
  resultCount: number;
  showLegend: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#E3DDD8]/80 bg-[#F8F6F3]/92 p-3 shadow-[0_8px_28px_rgba(47,43,40,0.10)] backdrop-blur-md sm:rounded-2xl sm:p-4">
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-1">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-[#73706C]">Search</span>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Name, state, district…"
              className="w-full rounded-xl border border-[#E3DDD8] bg-[#FBF9F6]/90 px-3 py-2 text-sm text-[#2F2B28] outline-none placeholder:text-[#9A9691] focus:border-[#0B6E66]/50 focus:ring-2 focus:ring-[#0B6E66]/20"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-[#73706C]">Category</span>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-[#E3DDD8] bg-[#FBF9F6]/90 px-3 py-2 text-sm text-[#2F2B28] outline-none focus:border-[#0B6E66]/50 focus:ring-2 focus:ring-[#0B6E66]/20"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[#73706C]">
            <span className="font-semibold text-[#2F2B28]">{formatNumber(resultCount)}</span>{" "}
            results
          </div>
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-sm text-[#0B6E66] hover:underline"
          >
            Reset
          </button>
        </div>

        {showLegend ? (
          <div className="flex flex-col gap-1.5 border-t border-[#E3DDD8]/70 pt-3">
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <div key={c} className="flex items-center gap-2 text-xs text-[#73706C]">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full opacity-90"
                    style={{ backgroundColor: pinColorForCategory(c) }}
                  />
                  {c}
                </div>
              ))}
            <div className="flex items-center gap-2 text-xs text-[#73706C]">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full opacity-90"
                style={{ backgroundColor: SELECTED_PIN_COLOR }}
              />
              Selected
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#E3DDD8]/70 pt-2.5">
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <div key={c} className="flex items-center gap-1.5 text-[11px] text-[#73706C]">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full opacity-90"
                    style={{ backgroundColor: pinColorForCategory(c) }}
                  />
                  {c}
                </div>
              ))}
            <div className="flex items-center gap-1.5 text-[11px] text-[#73706C]">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full opacity-90"
                style={{ backgroundColor: SELECTED_PIN_COLOR }}
              />
              Selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type MapResultsPanelProps = {
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  filteredCount: number;
  pageDocs: MapsDataDocument[];
  selectedId: string | null;
  selectedItemRef: RefObject<HTMLLIElement | null>;
  safePage: number;
  totalPages: number;
  onSelect: (id: string) => void;
  onCollapse?: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  className?: string;
};

function MapResultsPanel({
  status,
  error,
  filteredCount,
  pageDocs,
  selectedId,
  selectedItemRef,
  safePage,
  totalPages,
  onSelect,
  onCollapse,
  onPrevPage,
  onNextPage,
  className = "",
}: MapResultsPanelProps) {
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E3DDD8]/80 bg-[#F8F6F3]/92 shadow-[0_8px_28px_rgba(47,43,40,0.10)] backdrop-blur-md sm:rounded-2xl ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#E3DDD8]/70 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="font-semibold text-[#2F2B28]">Results</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#73706C]">{formatNumber(filteredCount)} sites</span>
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse results"
              title="Collapse results"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#73706C] transition-colors hover:bg-[#0B6E66]/8 hover:text-[#2F2B28]"
            >
              <ChevronIcon direction="right" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {status === "loading" && (
          <ul className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="border-b border-[#E3DDD8]/50 px-4 py-3 last:border-b-0">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#0B6E66]/10" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#0B6E66]/8" />
                <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-[#AB863F]/15" />
              </li>
            ))}
          </ul>
        )}

        {status === "error" && (
          <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        )}

        {status === "success" && filteredCount === 0 && (
          <div className="px-4 py-6 text-sm text-[#73706C]">
            No sites match your search. Try a different name or category.
          </div>
        )}

        {status === "success" && filteredCount > 0 && (
          <ul className="flex flex-col">
            {pageDocs.map((doc) => {
              const isSelected = doc._id.$oid === selectedId;
              return (
                <li
                  key={doc._id.$oid}
                  ref={isSelected ? selectedItemRef : undefined}
                  className="border-b border-[#E3DDD8]/50 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(doc._id.$oid)}
                    className={`block w-full px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3 ${
                      isSelected
                        ? "border-l-4 border-[#0B6E66] bg-[#0B6E66]/10 pl-2.5 sm:pl-3"
                        : "border-l-4 border-transparent hover:bg-[#9BCDB2]/15"
                    }`}
                  >
                    <div className="font-semibold leading-snug text-[#2F2B28]">{doc.name}</div>
                    <div className="mt-0.5 text-xs text-[#73706C]">
                      {doc.category} · {doc.district}, {doc.state}
                    </div>
                    <div className="mt-1 text-xs text-[#73706C]">
                      {doc.area_display} · Best time: {doc.year_visit}
                    </div>

                    {isSelected && (
                      <div className="mt-2 flex flex-col gap-2 border-t border-[#E3DDD8]/70 pt-2 text-xs text-[#73706C]">
                        <div>
                          <span className="font-semibold text-[#2F2B28]">Habitat:</span>{" "}
                          {doc.habitat}
                        </div>
                        <div>
                          <span className="font-semibold text-[#2F2B28]">Bio zone:</span>{" "}
                          {doc.bio_zone}
                        </div>
                        <TagList label="Wildlife" items={doc.animals} />
                        <TagList label="Flora" items={doc.plants} italic />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {status === "success" && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E3DDD8]/70 px-3 py-2 sm:px-4">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={onPrevPage}
            className="rounded-lg px-2 py-1 text-sm text-[#0B6E66] hover:underline disabled:cursor-not-allowed disabled:text-[#73706C]/50 disabled:no-underline"
          >
            Prev
          </button>
          <div className="text-xs text-[#73706C]">
            Page {safePage} / {totalPages}
          </div>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={onNextPage}
            className="rounded-lg px-2 py-1 text-sm text-[#0B6E66] hover:underline disabled:cursor-not-allowed disabled:text-[#73706C]/50 disabled:no-underline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function isMapReady(map: L.Map): boolean {
  const container = map.getContainer();
  return Boolean(container?.isConnected && map.getPane("mapPane"));
}

function safeStopMap(map: L.Map): void {
  if (!isMapReady(map)) return;
  try {
    map.stop();
  } catch {
    // Panes may already be removed during route unmount.
  }
}

function sameLatLng(a: LatLng, b: LatLng): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Single controller for map viewport changes. Leaflet throws when `fitBounds` and
 * `flyTo` run overlapping zoom transitions (e.g. a stale selection while filters
 * change), so selection wins and bounds fitting is non-animated.
 */
function MapViewController({
  points,
  selectedTarget,
}: {
  points: LatLng[];
  selectedTarget: LatLng | null;
}) {
  const map = useMap();
  const lastSelectedRef = useRef<LatLng | null>(null);
  const lastBoundsKeyRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;

    const applyView = () => {
      if (cancelled || !isMapReady(map)) return;

      if (selectedTarget) {
        const last = lastSelectedRef.current;
        if (!last || !sameLatLng(last, selectedTarget)) {
          safeStopMap(map);
          map.flyTo(selectedTarget, SELECTED_ZOOM, { animate: true });
          lastSelectedRef.current = selectedTarget;
        }
        return;
      }

      lastSelectedRef.current = null;

      const boundsKey = points.map((p) => p.join(",")).join("|");
      if (boundsKey === lastBoundsKeyRef.current) return;
      lastBoundsKeyRef.current = boundsKey;

      if (points.length === 0) return;

      safeStopMap(map);
      if (points.length === 1) {
        const point = points[0];
        if (point) map.setView(point, 8, { animate: false });
        return;
      }
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24], animate: false });
    };

    map.whenReady(() => {
      if (cancelled) return;
      frameId = requestAnimationFrame(applyView);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [map, points, selectedTarget]);

  return null;
}

export function MapSection() {
  useEffect(() => {
    // Ensure marker icons resolve correctly in bundlers.
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: icon2xUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const { status, data, error } = useMapsData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const selectedItemRef = useRef<HTMLLIElement | null>(null);

  const allDocs = data ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const doc of allDocs) set.add(doc.category);
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allDocs]);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allDocs.filter((doc) => {
      if (category !== "All" && doc.category !== category) return false;
      if (!q) return true;
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.state.toLowerCase().includes(q) ||
        doc.district.toLowerCase().includes(q)
      );
    });
  }, [allDocs, category, query]);

  // A new search or filter always starts from the first page of results.
  useEffect(() => {
    setPage(1);
  }, [query, category]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageDocs = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDocs.slice(start, start + PAGE_SIZE);
  }, [filteredDocs, safePage]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return allDocs.find((d) => d._id.$oid === selectedId) ?? null;
  }, [allDocs, selectedId]);

  // Selecting a site (from a map marker or the list) opens the panel and
  // jumps to the page that actually contains the selected card.
  useEffect(() => {
    if (!selectedId) return;
    const index = filteredDocs.findIndex((doc) => doc._id.$oid === selectedId);
    if (index === -1) return;
    setIsResultsOpen(true);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
  }, [selectedId, filteredDocs]);

  // Once the selected card is rendered on the active page, scroll it into view.
  useEffect(() => {
    if (!isResultsOpen || !selectedId) return;
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isResultsOpen, selectedId, safePage]);

  const points = useMemo(() => filteredDocs.map(asLatLng), [filteredDocs]);
  const selectedPoint = useMemo(() => {
    if (!selected || !selectedId) return null;
    const isVisible = filteredDocs.some((doc) => doc._id.$oid === selectedId);
    return isVisible ? asLatLng(selected) : null;
  }, [selected, selectedId, filteredDocs]);

  // Typing a search or picking a category is an explicit "show me results"
  // intent, so it reveals the panel. Opening lives in the event handlers
  // (not an effect) to avoid spurious opens from StrictMode/mount re-runs.
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setIsResultsOpen(true);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setIsResultsOpen(true);
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setSelectedId(null);
  };

  return (
    <section className="mx-auto max-w-[1920px] page-px pt-12 sm:pt-16 lg:pt-20">
      <div className="mb-4 flex flex-col gap-1.5 sm:mb-5 sm:gap-2 md:mb-5 lg:mb-6">
        <h2 className="font-['Nunito'] font-bold text-[16px] leading-snug text-[#AB863F] sm:text-[18px] sm:leading-8 md:text-[20px] lg:text-[24px]">
          Find Your Next Wildlife Destination
        </h2>
        <p className="max-w-3xl font-['Nunito'] font-semibold text-[15px] leading-snug text-[#2F2B28] sm:text-[16px] md:text-[18px] lg:text-[24px] lg:leading-8">
          Navigate through national parks, uncover the best seasons, and plan meaningful wildlife
          experiences.
        </p>
      </div>

      {/* Mobile / tablet filters sit above the map so the map stays usable */}
      <div className="mb-3 lg:hidden">
        <MapFiltersPanel
          query={query}
          category={category}
          categories={categories}
          resultCount={filteredDocs.length}
          showLegend={false}
          onQueryChange={handleQueryChange}
          onCategoryChange={handleCategoryChange}
          onReset={resetFilters}
        />
      </div>

      <div className="flex flex-col gap-3 lg:block">
        {/* `isolate` scopes Leaflet's internal z-indexes so the map never paints over the navbar. */}
        <div
          id="map"
          className="relative isolate h-[300px] w-full scroll-mt-28 overflow-hidden rounded-xl border border-[#E3DDD8]/70 bg-[#F3EEE9]/50 shadow-[0_16px_48px_rgba(47,43,40,0.08)] sm:h-[380px] sm:rounded-2xl md:h-[520px] lg:h-[680px]"
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            zoomControl={false}
            className="absolute inset-0 h-full w-full"
          >
            <ZoomControl position="bottomleft" />
            <MapViewController points={points} selectedTarget={selectedPoint} />
            <TileLayer
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            />
            {status === "success" && (
              <MarkerClusterGroup
                chunkedLoading
                showCoverageOnHover={false}
                iconCreateFunction={createClusterIcon}
              >
                {filteredDocs.map((doc) => {
                  const position = asLatLng(doc);
                  const isSelected = doc._id.$oid === selectedId;
                  const pinColor = isSelected
                    ? SELECTED_PIN_COLOR
                    : pinColorForCategory(doc.category);
                  return (
                    <Marker
                      key={doc._id.$oid}
                      position={position}
                      icon={getPinIcon(pinColor, isSelected)}
                      zIndexOffset={isSelected ? 1000 : 0}
                      eventHandlers={{
                        click: () => setSelectedId(doc._id.$oid),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px] max-w-[280px] sm:min-w-[240px]">
                          <div className="font-semibold text-wildbook-text">{doc.name}</div>
                          <div className="text-sm text-wildbook-muted">
                            {doc.category} · {doc.district}, {doc.state}
                          </div>
                          <div className="mt-1 text-sm text-wildbook-muted">
                            {doc.area_display} · Best time: {doc.year_visit}
                          </div>
                          {doc.animals.length > 0 && (
                            <div className="mt-1 text-sm text-wildbook-muted">
                              <span className="font-semibold text-wildbook-text">Wildlife:</span>{" "}
                              {doc.animals.slice(0, 5).join(", ")}
                              {doc.animals.length > 5 ? ` +${doc.animals.length - 5} more` : ""}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            )}
          </MapContainer>

          {/* Desktop: search + filters overlay */}
          <div className="pointer-events-none absolute top-4 left-4 z-1000 hidden w-[320px] lg:block">
            <div className="pointer-events-auto">
              <MapFiltersPanel
                query={query}
                category={category}
                categories={categories}
                resultCount={filteredDocs.length}
                showLegend
                onQueryChange={handleQueryChange}
                onCategoryChange={handleCategoryChange}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* Desktop: collapsible results overlay */}
          <div className="pointer-events-none absolute inset-y-4 right-4 z-1000 hidden w-[360px] flex-col items-end justify-start lg:flex">
            {isResultsOpen ? (
              <div className="pointer-events-auto h-full w-full min-h-0">
                <MapResultsPanel
                  status={status}
                  error={error}
                  filteredCount={filteredDocs.length}
                  pageDocs={pageDocs}
                  selectedId={selectedId}
                  selectedItemRef={selectedItemRef}
                  safePage={safePage}
                  totalPages={totalPages}
                  onSelect={setSelectedId}
                  onCollapse={() => setIsResultsOpen(false)}
                  onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
                  onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-full"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResultsOpen(true)}
                aria-label="Expand results"
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#E3DDD8]/80 bg-[#F8F6F3]/92 px-4 py-2 text-sm font-semibold text-[#2F2B28] shadow-[0_6px_20px_rgba(47,43,40,0.10)] backdrop-blur-md transition-colors hover:bg-[#FBF9F6]"
              >
                <ChevronIcon direction="left" />
                Results
                <span className="rounded-full bg-[#0B6E66]/12 px-2 py-0.5 text-xs text-[#0B6E66]">
                  {formatNumber(filteredDocs.length)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / tablet: results below the map */}
        <div className="lg:hidden">
          {isResultsOpen ? (
            <MapResultsPanel
              status={status}
              error={error}
              filteredCount={filteredDocs.length}
              pageDocs={pageDocs}
              selectedId={selectedId}
              selectedItemRef={selectedItemRef}
              safePage={safePage}
              totalPages={totalPages}
              onSelect={setSelectedId}
              onCollapse={() => setIsResultsOpen(false)}
              onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
              onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-[min(420px,55svh)] sm:h-[min(480px,50svh)] md:h-[min(520px,48svh)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsResultsOpen(true)}
              aria-label="Expand results"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E3DDD8]/80 bg-[#F8F6F3]/92 px-4 py-3 text-sm font-semibold text-[#2F2B28] shadow-[0_6px_20px_rgba(47,43,40,0.10)] backdrop-blur-md transition-colors hover:bg-[#FBF9F6] sm:rounded-2xl"
            >
              <ChevronIcon direction="left" />
              View results
              <span className="rounded-full bg-[#0B6E66]/12 px-2 py-0.5 text-xs text-[#0B6E66]">
                {formatNumber(filteredDocs.length)}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
