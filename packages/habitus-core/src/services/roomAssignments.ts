/**
 * Room assignment service - manages host assignments to individual rooms
 * Replaces listing-level assignments with room-level granularity
 */

import { getSupabase } from "../client";

// Types
export interface Room {
  id: string;
  listing_id: string;
  name: string;
  room_type: string;
  price_monthly: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomWithListing extends Room {
  listing_name: string;
  listing_city: string | null;
}

export interface RoomAssignment {
  id: string;
  room_id: string;
  host_profile_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
}

export interface RoomWithAssignment extends RoomWithListing {
  host_id: string | null;
  host_name: string | null;
  host_email: string | null;
  assigned_at: string | null;
  assigned_by_name: string | null;
  owner_id: string;
  owner_name: string;
  owner_email: string;
}

export interface AdminRoomRow {
  room_id: string;
  room_name: string;
  room_type: string;
  price_monthly: number;
  listing_id: string;
  listing_name: string;
  listing_city: string | null;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  host_id: string | null;
  host_name: string | null;
  host_email: string | null;
  assigned_at: string | null;
  assigned_by_name: string | null;
  is_active: boolean;
}

// Fetch all rooms with assignments for admin
export async function fetchAdminRoomAssignments(): Promise<RoomWithAssignment[]> {
  const { data, error } = await getSupabase().rpc("admin_get_rooms_with_assignments");

  if (error) throw error;
  if (!data) return [];

  return data.map((row: AdminRoomRow) => ({
    id: row.room_id,
    listing_id: row.listing_id,
    name: row.room_name,
    room_type: row.room_type,
    price_monthly: Number(row.price_monthly),
    is_active: row.is_active,
    listing_name: row.listing_name,
    listing_city: row.listing_city,
    host_id: row.host_id,
    host_name: row.host_name,
    host_email: row.host_email,
    assigned_at: row.assigned_at,
    assigned_by_name: row.assigned_by_name,
    owner_id: row.owner_id,
    owner_name: row.owner_name,
    owner_email: row.owner_email,
    created_at: row.assigned_at || "",
    updated_at: row.assigned_at || "",
  }));
}

// Create a new room
export async function createRoom(
  listingId: string,
  name: string,
  roomType: string,
  priceMonthly: number
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  const { data, error } = await getSupabase().rpc("admin_create_room", {
    p_listing_id: listingId,
    p_name: name,
    p_room_type: roomType,
    p_price_monthly: priceMonthly,
  });

  if (error) return { success: false, error: error.message };

  const parsed = data as { success: boolean; room_id?: string; error?: string };
  return {
    success: parsed.success,
    roomId: parsed.room_id,
    error: parsed.error,
  };
}

// Update room details
export async function updateRoom(
  roomId: string,
  updates: {
    name?: string;
    roomType?: string;
    priceMonthly?: number;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await getSupabase().rpc("admin_update_room", {
    p_room_id: roomId,
    p_name: updates.name ?? null,
    p_room_type: updates.roomType ?? null,
    p_price_monthly: updates.priceMonthly ?? null,
    p_is_active: updates.isActive ?? null,
  });

  if (error) return { success: false, error: error.message };

  const parsed = data as { success: boolean; error?: string };
  return {
    success: parsed.success,
    error: parsed.error,
  };
}

// Assign a host to a room
export async function assignRoomHost(
  roomId: string,
  hostProfileId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await getSupabase().rpc("admin_assign_room_host", {
    p_room_id: roomId,
    p_host_profile_id: hostProfileId,
  });

  if (error) return { success: false, error: error.message };

  const parsed = data as { success: boolean; error?: string };
  return {
    success: parsed.success,
    error: parsed.error,
  };
}

// Remove host assignment from a room
export async function removeRoomHost(
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await getSupabase().rpc("admin_remove_room_host", {
    p_room_id: roomId,
  });

  if (error) return { success: false, error: error.message };

  const parsed = data as { success: boolean; error?: string };
  return {
    success: parsed.success,
    error: parsed.error,
  };
}
