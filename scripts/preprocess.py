"""Preprocess parquet files into JSON for the frontend.

Reads all .nakama-0 parquet files from the data folders, decodes events,
groups by match_id, and exports aggregated JSON files.
"""

import json
import os
import re
from collections import defaultdict
from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent  # lila-black-viz/
DATA_DIR = PROJECT_DIR.parent  # player_data/
OUTPUT_DIR = PROJECT_DIR / "public" / "data"

MAP_CONFIGS = {
    "AmbroseValley": {"scale": 900, "origin_x": -370, "origin_z": -473},
    "GrandRift": {"scale": 581, "origin_x": -290, "origin_z": -290},
    "Lockdown": {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

IS_COMBAT_EVENT = {
    "Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"
}

DATE_DIRS = ["February_10", "February_11", "February_12", "February_13", "February_14"]


def is_bot_filename(filename):
    """Detect bot by filename: first segment is all-numeric."""
    first_segment = filename.split("_")[0]
    return bool(re.match(r"^\d+$", first_segment))


def decode_event(event_val):
    if isinstance(event_val, bytes):
        return event_val.decode("utf-8")
    return str(event_val)


def world_to_pixel(x, z, map_id):
    """Convert world coordinates to pixel coordinates on the minimap."""
    cfg = MAP_CONFIGS.get(map_id)
    if cfg is None:
        return None, None
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = u * 1024
    py = (1 - v) * 1024
    return round(px, 2), round(py, 2)


def parse_user_id(filename):
    """Extract user_id from filename (before the first underscore-separated match_id)."""
    parts = filename.split(".nakama-0")[0]
    match_parts = parts.rsplit("_", 1)
    if len(match_parts) == 2:
        uid_part = match_parts[0]
    else:
        uid_part = parts
    return uid_part


def parse_match_id(filename):
    """Extract match_id from filename."""
    parts = filename.split(".nakama-0")[0]
    match_parts = parts.rsplit("_", 1)
    if len(match_parts) == 2:
        return match_parts[1]
    return parts


def process():
    output_dir = Path(OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Collect all data
    all_events = []
    match_meta = defaultdict(lambda: {
        "match_id": "",
        "map_id": "",
        "dates": set(),
        "player_count": 0,
        "bot_count": 0,
        "human_count": 0,
    })

    total_files = 0
    skipped = 0

    for date_dir in DATE_DIRS:
        folder = DATA_DIR / date_dir
        if not folder.exists():
            continue
        for fname in sorted(os.listdir(folder)):
            fpath = folder / fname
            if fname.startswith(".") or not fname.endswith(".nakama-0"):
                continue
            try:
                table = pq.read_table(str(fpath))
                df = table.to_pandas()
            except Exception:
                skipped += 1
                continue

            total_files += 1

            # Decode event column
            df["event_str"] = df["event"].apply(decode_event)

            # Parse user_id and match_id from filename
            user_id = parse_user_id(fname)
            match_id = parse_match_id(fname)
            is_bot = is_bot_filename(fname)

            # Get map_id (consistent for the file)
            map_id = df["map_id"].iloc[0] if len(df) > 0 else "Unknown"

            # Update match metadata
            meta = match_meta[match_id]
            meta["match_id"] = match_id
            meta["map_id"] = map_id
            meta["dates"].add(date_dir)
            if is_bot:
                meta["bot_count"] += 1
            else:
                meta["human_count"] += 1

            # Process rows
            for _, row in df.iterrows():
                x = float(row["x"])
                z = float(row["z"])
                ts_raw = row["ts"]
                # Convert timestamp to milliseconds since epoch
                try:
                    ts_ms = int(pd.Timestamp(ts_raw).timestamp() * 1000)
                except Exception:
                    ts_ms = 0

                event_str = row["event_str"]
                px, py = world_to_pixel(x, z, map_id)

                evt = {
                    "user_id": user_id,
                    "match_id": match_id,
                    "map_id": map_id,
                    "x": round(float(x), 2),
                    "z": round(float(z), 2),
                    "px": px,
                    "py": py,
                    "ts": ts_ms,
                    "event": event_str,
                    "is_bot": is_bot,
                    "is_combat": event_str in IS_COMBAT_EVENT,
                }
                all_events.append(evt)

    # Convert match_meta dates from sets to sorted lists
    for mid in match_meta:
        match_meta[mid]["dates"] = sorted(match_meta[mid]["dates"])
        match_meta[mid]["total_players"] = match_meta[mid]["human_count"] + match_meta[mid]["bot_count"]

    print(f"Processed {total_files} files, skipped {skipped}")
    print(f"Total events: {len(all_events)}")
    print(f"Total matches: {len(match_meta)}")

    # Group events by match_id
    matches_data = defaultdict(list)
    for evt in all_events:
        matches_data[evt["match_id"]].append(evt)

    # Compute relative timestamps within each match
    for mid, events in matches_data.items():
        if not events:
            continue
        min_ts = min(e["ts"] for e in events)
        for e in events:
            e["rel_ts"] = e["ts"] - min_ts

    # Export match metadata
    meta_list = []
    for mid, meta in match_meta.items():
        meta_list.append({
            "match_id": mid,
            "map_id": meta["map_id"],
            "dates": meta["dates"],
            "human_count": meta["human_count"],
            "bot_count": meta["bot_count"],
            "total_players": meta["total_players"],
        })

    with open(output_dir / "matches.json", "w") as f:
        json.dump(meta_list, f)
    print(f"Exported matches.json ({len(meta_list)} matches)")

    # Export per-map aggregated data for heatmaps
    map_heatmap_data = defaultdict(lambda: {
        "kill_positions": [],    # px, py for Kill events
        "death_positions": [],   # px, py for Killed events
        "storm_death_positions": [],
        "movement_positions": [],  # sampled every N events
        "loot_positions": [],
    })

    for evt in all_events:
        mid = evt["map_id"]
        if evt["px"] is None:
            continue
        if evt["event"] == "Kill":
            map_heatmap_data[mid]["kill_positions"].append([evt["px"], evt["py"]])
        elif evt["event"] in ("Killed", "BotKilled"):
            map_heatmap_data[mid]["death_positions"].append([evt["px"], evt["py"]])
        elif evt["event"] == "KilledByStorm":
            map_heatmap_data[mid]["storm_death_positions"].append([evt["px"], evt["py"]])
        elif evt["event"] == "Loot":
            map_heatmap_data[mid]["loot_positions"].append([evt["px"], evt["py"]])

    # Sample movement positions (every 20th to keep size reasonable)
    for evt in all_events[::20]:
        mid = evt["map_id"]
        if evt["px"] is not None and evt["event"] in ("Position", "BotPosition"):
            map_heatmap_data[mid]["movement_positions"].append([evt["px"], evt["py"]])

    # Convert defaultdict to regular dict
    for mid in map_heatmap_data:
        map_heatmap_data[mid]["kill_count"] = len(map_heatmap_data[mid]["kill_positions"])
        map_heatmap_data[mid]["death_count"] = len(map_heatmap_data[mid]["death_positions"])
        map_heatmap_data[mid]["storm_death_count"] = len(map_heatmap_data[mid]["storm_death_positions"])
        map_heatmap_data[mid]["loot_count"] = len(map_heatmap_data[mid]["loot_positions"])

    with open(output_dir / "heatmaps.json", "w") as f:
        json.dump(dict(map_heatmap_data), f)
    print("Exported heatmaps.json")

    # Export per-match data (each match as separate file for lazy loading)
    matches_subdir = output_dir / "matches"
    matches_subdir.mkdir(parents=True, exist_ok=True)
    for mid, events in matches_data.items():
        with open(matches_subdir / f"{mid}.json", "w") as f:
            json.dump(events, f)

    print(f"Exported {len(matches_data)} match files")

    print("\nDone! Data ready for the frontend.")


if __name__ == "__main__":
    process()