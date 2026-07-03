"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RequestType = "prayer" | "appointment" | "join";

type ConvertPublicRequestToFollowupButtonProps = {
  requestType: RequestType;
  requestId: string;
  churchId: string;
  name: string | null;
  phone?: string | null;
  message: string;
  profileId: string;
};

function getSource(requestType: RequestType) {
  if (requestType === "prayer") return "demande_priere";
  if (requestType === "appointment") return "rendez_vous";
  if (requestType === "join") return "demande_integration";

  return "demande_publique";
}

function getNeedType(requestType: RequestType) {
  if (requestType === "prayer") return "priere";
  if (requestType === "appointment") return "accompagnement";
  if (requestType === "join") return "integration";

  return "autre";
}

function getTableName(requestType: RequestType) {
  if (requestType === "prayer") return "prayer_requests";
  if (requestType === "appointment") return "appointments";
  return "join_requests";
}

export default function ConvertPublicRequestToFollowupButton({
  requestType,
  requestId,
  churchId,
  name,
  phone,
  message,
  profileId,
}: ConvertPublicRequestToFollowupButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConvert() {
    const confirmed = window.confirm(
      "Voulez-vous créer un suivi pastoral pour cette demande ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { data: existingFollowup, error: existingError } = await supabase
      .from("soul_followups")
      .select("id")
      .eq("church_id", churchId)
      .eq("source_request_type", requestType)
      .eq("source_request_id", requestId)
      .maybeSingle();

    if (existingError) {
      alert(existingError.message);
      setIsLoading(false);
      return;
    }

    if (existingFollowup) {
      setIsLoading(false);
      router.push(`/souls/${existingFollowup.id}`);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: followup, error } = await supabase
      .from("soul_followups")
      .insert({
        church_id: churchId,
        member_id: null,
        full_name: name || "Visiteur",
        phone: phone || null,
        source: getSource(requestType),
        need_type: getNeedType(requestType),
        priority: requestType === "appointment" ? "haute" : "normale",
        status: "nouveau",
        first_contact_date: today,
        last_contact_date: today,
        next_followup_date: null,
        assigned_to: profileId,
        created_by: profileId,
        notes: message,
        source_request_type: requestType,
        source_request_id: requestId,
      })
      .select("id")
      .single();

    if (error || !followup) {
      alert(error?.message || "Erreur lors de la création du suivi.");
      setIsLoading(false);
      return;
    }

    await supabase
      .from(getTableName(requestType))
      .update({ status: "en_cours" })
      .eq("id", requestId);

    setIsLoading(false);

    router.push(`/souls/${followup.id}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleConvert}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <HeartHandshake className="h-4 w-4" />
      )}

      {isLoading ? "Création..." : "Créer suivi"}
    </button>
  );
}