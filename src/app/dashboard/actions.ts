"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Erreur lors de la déconnexion")}`);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
