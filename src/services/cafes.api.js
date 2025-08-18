import { supabase } from "./supabaseClient";

export async function createCafe(data) {
  const { data: row, error } = await supabase
    .from("cafes").insert([data]).select().single();
  if (error) throw error;
  return row;
}

export async function listCafes() {
  const { data, error } = await supabase
    .from("cafes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}