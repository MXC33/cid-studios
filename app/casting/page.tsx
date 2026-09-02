"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Users,
  ShieldCheck,
  Volume2,
  Filter,
  Layers,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Character } from "@/lib/db/schema";
import { CharacterCard } from "@/components/casting/CharacterCard";
import { CharacterEditorModal } from "@/components/casting/CharacterEditorModal";
import { cn } from "@/lib/utils";

const ROLE_FILTERS = [
  { label: "ALL ROLES", value: "ALL" },
  { label: "LEADS", value: "LEAD" },
  { label: "SUPPORTING", value: "SUPPORTING" },
  { label: "ANTAGONISTS", value: "ANTAGONIST" },
  { label: "EXTRAS", value: "EXTRA" },
];

export default function CastingPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/characters");
      const data = await res.json();
      if (data.success && Array.isArray(data.characters)) {
        setCharacters(data.characters);
      }
    } catch (err) {
      console.error("Failed to load characters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleOpenCreate = () => {
    setEditingCharacter(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (char: Character) => {
    setEditingCharacter(char);
    setIsModalOpen(true);
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("Are you sure you want to remove this character?")) return;
    try {
      const res = await fetch(`/api/characters?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete character:", err);
    }
  };

  // Filtered roster
  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        char.name.toLowerCase().includes(q) ||
        (char.role && char.role.toLowerCase().includes(q)) ||
        (char.description && char.description.toLowerCase().includes(q)) ||
        (char.voice_profile && char.voice_profile.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedRole === "ALL") return true;
      const r = (char.role || "LEAD").toUpperCase();
      return r.includes(selectedRole);
    });
  }, [characters, searchQuery, selectedRole]);

  // Statistics
  const totalCount = characters.length;
  const fullyAnchoredCount = characters.filter(
    (c) => c.ref_sheet_path && c.ref_body_path && c.ref_action_path && c.ref_expression_path
  ).length;
  const voiceProfileCount = characters.filter((c) => c.voice_profile).length;
  const leadCount = characters.filter((c) => (c.role || "").toUpperCase().includes("LEAD")).length;

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full font-mono">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold uppercase tracking-wider">
              PRE-PRODUCTION WING
            </span>
            <span className="text-xs text-[#71717a]">MODULE 01</span>
          </div>
          <h1 className="text-2xl font-bold text-[#fafafa] mt-1">CASTING FORGE</h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            4-Angle consistency matrix (Turnaround, Silhouette, Action, Expressions) + Voice profiles + Auto prompt generator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCharacters}
            className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Refresh Characters"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-[#10b981]")} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE CHARACTER</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">TOTAL ROSTER</span>
            <p className="text-lg font-bold text-[#fafafa]">{totalCount}</p>
          </div>
          <Users className="w-5 h-5 text-[#3b82f6]" />
        </div>

        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">4/4 REF LOCKED</span>
            <p className="text-lg font-bold text-[#10b981]">{fullyAnchoredCount}</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#10b981]" />
        </div>

        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">LEAD OPERATIVES</span>
            <p className="text-lg font-bold text-[#3b82f6]">{leadCount}</p>
          </div>
          <Sparkles className="w-5 h-5 text-[#3b82f6]" />
        </div>

        <div className="p-3 bg-[#121215] border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717a] uppercase">VOICE PROFILES</span>
            <p className="text-lg font-bold text-[#f59e0b]">{voiceProfileCount}</p>
          </div>
          <Volume2 className="w-5 h-5 text-[#f59e0b]" />
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#121215] border border-[#27272a]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search characters by name, role, visual tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#10b981] pl-9 pr-3 py-1.5 text-xs text-[#fafafa] outline-none font-mono placeholder:text-[#52525b]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3 h-3 text-[#71717a] shrink-0 mr-1" />
          {ROLE_FILTERS.map((rf) => (
            <button
              key={rf.value}
              onClick={() => setSelectedRole(rf.value)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border",
                selectedRole === rf.value
                  ? "bg-[#18181b] border-[#10b981] text-[#10b981]"
                  : "bg-transparent border-[#27272a] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]"
              )}
            >
              {rf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Characters Roster Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-[#121215] border border-[#27272a]">
          <Loader2 className="w-6 h-6 text-[#10b981] animate-spin" />
          <span className="text-xs uppercase font-bold text-[#fafafa]">SYNCING CASTING DATABASE...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteCharacter}
            />
          ))}

          {/* Add Character Slot Card */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-[#121215] border-2 border-dashed border-[#27272a] hover:border-[#10b981] transition-all p-6 flex flex-col items-center justify-center text-center group cursor-pointer min-h-[380px]"
          >
            <div className="p-3 bg-[#18181b] border border-[#27272a] group-hover:border-[#10b981] text-[#71717a] group-hover:text-[#10b981] transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-[#fafafa] mt-3 group-hover:text-[#10b981] uppercase">
              ADD NEW CHARACTER
            </span>
            <span className="text-[10px] text-[#71717a] mt-1 max-w-[200px]">
              Load 4-View Turnarounds & Reference Matrices
            </span>
          </button>
        </div>
      )}

      {/* Interactive Modal */}
      <CharacterEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        character={editingCharacter}
        onSaved={fetchCharacters}
      />
    </div>
  );
}
