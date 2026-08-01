import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import icon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import type { GeoJsonPoint, MapsDataDocument } from "../api/mapsData";
import { useMapsData } from "../hooks/useMapsData";
import { Reveal } from "../motion";

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

// Teal is reserved for the selected site so it always stands out. Each
// category gets its own distinct hue; unknown categories fall back to slate.
const SELECTED_PIN_COLOR = "#0b6e66";
const FALLBACK_PIN_COLOR = "#5b6770";
const CATEGORY_PIN_COLORS: Record<string, string> = {
  "National Park": "#2e7d32",
  "Wildlife Sanctuary": "#c77d2a",
};

function pinColorForCategory(category: string): string {
  return CATEGORY_PIN_COLORS[category] ?? FALLBACK_PIN_COLOR;
}

function pinSvg(height: number, fill: string): string {
  const width = Math.round(height * (2 / 3));
  return `<svg width="${width}" height="${height}" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 24 12 24s12-15.5 12-24C24 5.373 18.627 0 12 0z" fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
  </svg>`;
}

/**
 * The selected pin is larger and carries a teal glow so it reads as
 * "highlighted" at a glance alongside the selected results row.
 */
function createPinIcon(fill: string, isSelected: boolean): L.DivIcon {
  const height = isSelected ? 46 : 34;
  const width = Math.round(height * (2 / 3));
  const glow = isSelected
    ? "filter: drop-shadow(0 0 6px rgba(11,110,102,0.95)) drop-shadow(0 2px 3px rgba(0,0,0,0.35));"
    : "filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));";
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
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:rgba(11,110,102,0.92);color:#ffffff;font-weight:700;font-size:13px;border:3px solid rgba(255,255,255,0.85);box-shadow:0 2px 6px rgba(0,0,0,0.3);font-family:'Nunito',sans-serif;">${formatNumber(count)}</div>`;
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
            className={`rounded-full bg-black/5 px-2 py-0.5 text-[11px] leading-tight text-wildbook-text ${
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
    <section className="pt-16 lg:pt-20 mx-auto max-w-[1920px] page-px">
      <Reveal className="flex flex-col gap-[8px] mb-6 lg:mb-[24px]">
        <h2 className="font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">
          Find Your Next Wildlife Destination
        </h2>
        <p className="font-['Nunito'] font-semibold text-[16px] lg:text-[24px] leading-snug lg:leading-[32px] text-[#2F2B28] max-w-3xl">
          Navigate through national parks, uncover the best seasons, and plan meaningful wildlife experiences.
        </p>
      </Reveal>

      {/* `isolate` scopes Leaflet's internal z-indexes so the map never paints over the navbar. */}
      <Reveal
        preset="fadeUp"
        delay={0.1}
        early
        className="relative isolate h-[560px] lg:h-[680px] w-full overflow-hidden rounded-2xl border border-black/10 bg-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
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
                const pinColor = isSelected ? SELECTED_PIN_COLOR : pinColorForCategory(doc.category);
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
                      <div className="min-w-[240px]">
                        <div className="font-semibold text-wildbook-text">{doc.name}</div>
                        <div className="text-sm text-wildbook-muted">
                          {doc.category} · {doc.district}, {doc.state}
                        </div>
                        <div className="text-sm text-wildbook-muted mt-1">
                          {doc.area_display} · Best time: {doc.year_visit}
                        </div>
                        {doc.animals.length > 0 && (
                          <div className="text-sm text-wildbook-muted mt-1">
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

        {/* Left overlay: search + filters */}
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] w-[min(320px,calc(100%-5.5rem))]">
          <div className="pointer-events-auto rounded-2xl border border-black/10 bg-white/90 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-wildbook-muted">Search</span>
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Name, state, district…"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-wildbook-teal/30"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-wildbook-muted">Category</span>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-wildbook-teal/30"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-between">
                <div className="text-sm text-wildbook-muted">
                  <span className="font-semibold text-wildbook-text">{formatNumber(filteredDocs.length)}</span> results
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm text-wildbook-teal hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-black/10 pt-3">
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <div key={c} className="flex items-center gap-2 text-xs text-wildbook-muted">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: pinColorForCategory(c) }}
                      />
                      {c}
                    </div>
                  ))}
                <div className="flex items-center gap-2 text-xs text-wildbook-muted">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SELECTED_PIN_COLOR }}
                  />
                  Selected
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right overlay: collapsible results */}
        <div className="pointer-events-none absolute z-[1000] flex flex-col items-end justify-end left-3 right-3 bottom-3 h-[55%] lg:inset-y-4 lg:left-auto lg:right-4 lg:h-auto lg:w-[360px] lg:justify-start">
          {isResultsOpen ? (
            <div className="pointer-events-auto flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
                <div className="font-semibold text-wildbook-text">Results</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-wildbook-muted">{formatNumber(filteredDocs.length)} sites</span>
                  <button
                    type="button"
                    onClick={() => setIsResultsOpen(false)}
                    aria-label="Collapse results"
                    title="Collapse results"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-wildbook-muted transition-colors hover:bg-black/5 hover:text-wildbook-text"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {status === "loading" && (
                  <ul className="flex flex-col">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <li key={i} className="border-b border-black/5 px-4 py-3 last:border-b-0">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-black/10" />
                        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-black/10" />
                        <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-black/10" />
                      </li>
                    ))}
                  </ul>
                )}

                {status === "error" && (
                  <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-900">
                    {error}
                  </div>
                )}

                {status === "success" && filteredDocs.length === 0 && (
                  <div className="px-4 py-6 text-sm text-wildbook-muted">
                    No sites match your search. Try a different name or category.
                  </div>
                )}

                {status === "success" && filteredDocs.length > 0 && (
                  <ul className="flex flex-col">
                    {pageDocs.map((doc) => {
                      const isSelected = doc._id.$oid === selectedId;
                      return (
                        <li
                          key={doc._id.$oid}
                          ref={isSelected ? selectedItemRef : undefined}
                          className="border-b border-black/5 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(doc._id.$oid)}
                            className={`block w-full px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "border-l-4 border-wildbook-teal bg-wildbook-teal/15 pl-3"
                                : "border-l-4 border-transparent hover:bg-black/5"
                            }`}
                          >
                            <div className="font-semibold text-wildbook-text leading-snug">{doc.name}</div>
                            <div className="mt-0.5 text-xs text-wildbook-muted">
                              {doc.category} · {doc.district}, {doc.state}
                            </div>
                            <div className="mt-1 text-xs text-wildbook-muted">
                              {doc.area_display} · Best time: {doc.year_visit}
                            </div>

                            {isSelected && (
                              <div className="mt-2 flex flex-col gap-2 border-t border-black/10 pt-2 text-xs text-wildbook-muted">
                                <div>
                                  <span className="font-semibold text-wildbook-text">Habitat:</span> {doc.habitat}
                                </div>
                                <div>
                                  <span className="font-semibold text-wildbook-text">Bio zone:</span> {doc.bio_zone}
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
                <div className="flex items-center justify-between border-t border-black/10 px-4 py-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg px-2 py-1 text-sm text-wildbook-teal disabled:cursor-not-allowed disabled:text-wildbook-muted/50 hover:underline disabled:no-underline"
                  >
                    Prev
                  </button>
                  <div className="text-xs text-wildbook-muted">
                    Page {safePage} / {totalPages}
                  </div>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg px-2 py-1 text-sm text-wildbook-teal disabled:cursor-not-allowed disabled:text-wildbook-muted/50 hover:underline disabled:no-underline"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsResultsOpen(true)}
              aria-label="Expand results"
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-wildbook-text shadow-lg backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronIcon direction="left" />
              Results
              <span className="rounded-full bg-wildbook-teal/10 px-2 py-0.5 text-xs text-wildbook-teal">
                {formatNumber(filteredDocs.length)}
              </span>
            </button>
          )}
        </div>
      </Reveal>
    </section>
  );
}
