'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ProductListProps {
  listings: any[];
  styles: any[];
  selectedSku: string | null;
  onSelect: (sku: string) => void;
}

const COLOR_HEX: Record<string, string> = {
  black: '#333',
  brown: '#8B4513',
  blue: '#4169E1',
  demiblue: '#4169E1',
  gold: '#DAA520',
  silver: '#C0C0C0',
  purple: '#4B0082',
  red: '#dc2626',
  wine: '#800020',
};

function colorToHex(color: string): string {
  const key = color.toLowerCase().replace(/\s+/g, '');
  return COLOR_HEX[key] ?? '#666';
}

function getStatus(listing: any): 'green' | 'amber' | 'red' {
  const hasName = !!(listing.itemName && listing.itemName.trim());
  if (!hasName) return 'red';
  const hasAll =
    !!(listing.price && String(listing.price).trim()) &&
    !!(listing.quantity !== undefined && String(listing.quantity).trim()) &&
    !!(listing.mainImage && listing.mainImage.trim());
  return hasAll ? 'green' : 'amber';
}

export default function ProductList({ listings, styles, selectedSku, onSelect }: ProductListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        (l.sku && l.sku.toLowerCase().includes(q)) ||
        (l.color && l.color.toLowerCase().includes(q))
    );
  }, [listings, search]);

  // Group by parentSku, preserving insertion order
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const listing of filtered) {
      const parent = listing.parentSku ?? 'Unknown';
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(listing);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Auto-expand group when selectedSku is inside it
  const selectedGroup = selectedSku
    ? listings.find((l) => l.sku === selectedSku)?.parentSku ?? null
    : null;

  function toggleGroup(parentSku: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(parentSku)) next.delete(parentSku);
      else next.add(parentSku);
      return next;
    });
  }

  function isExpanded(parentSku: string): boolean {
    return expandedGroups.has(parentSku) || parentSku === selectedGroup;
  }

  return (
    <div className="left-panel">
      <div className="left-header">
        <h3>
          Products <span className="zh">产品列表</span>
        </h3>
        <button
          className="btn-new-listing"
          onClick={() => router.push('/new-style')}
          title="Create a new style in batch — parent + all color/strength variants"
        >
          + New Listing <span className="zh">新建款式</span>
        </button>
        <input
          className="search-box"
          type="text"
          placeholder="Search SKU or color / 搜索型号或颜色..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="left-list">
        {groups.map(([parentSku, variants]) => {
          const open = isExpanded(parentSku);
          return (
            <div key={parentSku}>
              <div
                className="group-head"
                onClick={() => toggleGroup(parentSku)}
                style={{ cursor: 'pointer' }}
              >
                <span className="group-arrow">{open ? '▼' : '▶'}</span>
                {parentSku}
                <span className="count">
                  {variants.length} variant{variants.length !== 1 ? 's' : ''} / 变体
                </span>
              </div>
              {open && variants.map((listing) => {
                const status = getStatus(listing);
                return (
                  <div
                    key={listing.sku}
                    className={`var-row${listing.sku === selectedSku ? ' active' : ''}`}
                    onClick={() => onSelect(listing.sku)}
                  >
                    <span
                      className="color-dot"
                      style={{ backgroundColor: colorToHex(listing.color ?? '') }}
                    />
                    <span className="var-name">
                      {listing.color ?? listing.sku}
                      {listing.strength ? <span style={{color:'#666',marginLeft:4,fontSize:12}}>+{listing.strength}</span> : null}
                    </span>
                    <span className={`status-dot st-${status}`} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
