"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  MapPin,
  Sun,
  Moon,
  Sunset,
  CloudFog,
  Zap,
  Filter,
  RefreshCw,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { Location } from "@/lib/db/schema";
import { LocationCard } from "@/components/locations/LocationCard";
import { LocationEditorModal } from "@/components/locations/LocationEditorModal";
import { cn } from "@/lib/utils";

const LIGHTING_FILTERS = [
  { label: "ALL LIGHTING", value: "ALL" },
  { label: "NIGHT NEON", value: "NIGHT" },
  { label: "DAYLIGHT", value: "DAY" },
  { label: "GOLDEN HOUR", value: "GOLDEN" },
  { label: "MOODY FOG", value: "FOG" },
  { label: "INTERIOR CYAN", value: "INTERIOR" },
];

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLighting, setSelectedLighting] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/locations");
      const data = await res.json();
      if (data.success && Array.isArray(data.locations)) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    setIsModalOpen(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this environment set?")) return;
    try {
      const res = await fetch(`/api/locations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete location:", err);
    }
  };

  // Filtered Locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        loc.name.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q)) ||
        (loc.time_of_day && loc.time_of_day.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedLighting === "ALL") return true;
      const tod = (loc.time_of_day || "").toUpperCase();
      return tod.includes(selectedLighting);
    });
  }, [locations, searchQuery, selectedLighting]);

  // Statistics
  const totalCount = locations.length;
  const multiAngleCount = locations.filter((l) => l.ref_main_path && l.ref_alt_path).length;
  const nightCount = locations.filter((l) => (l.time_of_day || "").toLowerCase().includes("night")).length;
  const dayCount = locations.filter((l) => (l.time_of_day || "").toLowerCase().includes("day") || (l.time_of_day || "").toLowerCase().includes("golden")).length;

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full font-mono">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-bold uppercase tracking-wider">
              PRE-PRODUCTION WING
            </span>
            <span className="text-xs text-[#71717a]">MODULE 02</span>
          </div>
          <h1 className="text-2xl font-bold text-[#fafafa] mt-1">LOCATION LOCKER</h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Multi-reference environmental sets (Day/Night, Wide establishing angles, Interior details, and lighting prompts).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLocations}
            className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Refresh Locations"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-[#3b82f6]")} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE LOCATION SET</span>
          </button>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">TOTAL SETS</span>
            <p className="text-lg font-bold text-[#fafafa]">{totalCount}</p>
          </div>
          <MapPin className="w-5 h-5 text-[#3b82f6]" />
        </div>

        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">MULTI-ANGLE SETS</span>
            <p className="text-lg font-bold text-[#10b981]">{multiAngleCount}</p>
          </div>
          <Layers className="w-5 h-5 text-[#10b981]" />
        </div>

        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">NIGHT / NEON</span>
            <p className="text-lg font-bold text-[#f59e0b]">{nightCount}</p>
          </div>
          <Moon className="w-5 h-5 text-[#f59e0b]" />
        </div>

        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">DAYLIGHT / GOLDEN</span>
            <p className="text-lg font-bold text-[#06b6d4]">{dayCount}</p>
          </div>
          <Sun className="w-5 h-5 text-[#06b6d4]" />
        </div>
      </div>

      {/* Search & Lighting Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#121215] border border-[#27272a]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search environments by name, lighting, atmosphere..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] pl-9 pr-3 py-1.5 text-xs text-[#fafafa] outline-none font-mono placeholder:text-[#52525b]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3 h-3 text-[#71717a] shrink-0 mr-1" />
          {LIGHTING_FILTERS.map((lf) => (
            <button
              key={lf.value}
              onClick={() => setSelectedLighting(lf.value)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border",
                selectedLighting === lf.value
                  ? "bg-[#18181b] border-[#3b82f6] text-[#3b82f6]"
                  : "bg-transparent border-[#27272a] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]"
              )}
            >
              {lf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location Sets Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-[#121215] border border-[#27272a]">
          <Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin" />
          <span className="text-xs uppercase font-bold text-[#fafafa]">SYNCING ENVIRONMENT VAULT...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteLocation}
            />
          ))}

          {/* Add Location Slot Card */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-[#121215] border-2 border-dashed border-[#27272a] hover:border-[#3b82f6] transition-all p-6 flex flex-col items-center justify-center text-center group cursor-pointer min-h-[300px]"
          >
            <div className="p-3 bg-[#18181b] border border-[#27272a] group-hover:border-[#3b82f6] text-[#71717a] group-hover:text-[#3b82f6] transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-[#fafafa] mt-3 group-hover:text-[#3b82f6] uppercase">
              ADD NEW ENVIRONMENT SET
            </span>
            <span className="text-[10px] text-[#71717a] mt-1 max-w-[200px]">
              Day/Night Lighting & Multi-Angle Architectural References
            </span>
          </button>
        </div>
      )}

      {/* Location Editor Modal */}
      <LocationEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={editingLocation}
        onSaved={fetchLocations}
      />
    </div>
  );
}
