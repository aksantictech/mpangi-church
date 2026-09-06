"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export type DownloadableMemberProfile = {
  fullName: string;
  memberCode: string;
  churchName: string;
  status: string;
  memberType: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  profession: string;
  familyName: string;
  familyRole: string;
  spouseName: string;
  childrenNames: string;
  emergencyContact: string;
  integration: string;
  spiritualStatus: string;
  discipleshipStage: string;
  conversionDate: string;
  baptismDate: string;
  membershipDate: string;
  mentorName: string;
  smallGroup: string;
  ministryInterests: string;
  spiritualGifts: string;
  volunteerAvailability: string;
  trainingGoal: string;
  departments: string[];
  trainings: string[];
  attendanceCount90Days: number;
  lastAttendance: string;
  pastoralFollowups: number;
  nextFollowup: string;
  notes: string;
  generatedAt: string;
};

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export default function MemberProfileDownload({ profile }: { profile: DownloadableMemberProfile }) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function downloadProfile() {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      let y = 18;

      const ensureSpace = (height: number) => {
        if (y + height <= 282) return;
        doc.addPage();
        y = 18;
      };

      const section = (title: string) => {
        ensureSpace(18);
        y += 5;
        doc.setFillColor(232, 241, 251);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 2, 2, "F");
        doc.setTextColor(8, 47, 87);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title, margin + 4, y + 6);
        y += 14;
      };

      const line = (label: string, value: string) => {
        ensureSpace(12);
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text(label.toUpperCase(), margin, y);
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value || "Non renseigné", pageWidth - margin * 2 - 42);
        doc.text(lines, margin + 42, y);
        y += Math.max(8, lines.length * 5);
      };

      doc.setFillColor(8, 47, 87);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 4, 4, "F");
      doc.setTextColor(191, 219, 254);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("DOSSIER INDIVIDUEL DU MEMBRE", margin + 7, y + 9);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(profile.fullName, margin + 7, y + 20, { maxWidth: pageWidth - margin * 2 - 14 });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${profile.churchName}  •  ${profile.memberCode}`, margin + 7, y + 30);
      y += 45;

      line("Statut", profile.status);
      line("Profil", profile.memberType);

      section("Identité et coordonnées");
      line("Téléphone", profile.phone);
      line("WhatsApp", profile.whatsapp);
      line("Email", profile.email);
      line("Adresse", profile.address);
      line("Naissance", profile.birthDate);
      line("Genre", profile.gender);
      line("État civil", profile.maritalStatus);
      line("Profession", profile.profession);

      section("Famille et proches");
      line("Foyer / famille", profile.familyName);
      line("Rôle familial", profile.familyRole);
      line("Conjoint(e)", profile.spouseName);
      line("Enfants / foyer", profile.childrenNames);
      line("Contact d'urgence", profile.emergencyContact);

      section("Parcours dans l’église");
      line("Intégration", profile.integration);
      line("Statut spirituel", profile.spiritualStatus);
      line("Étape du parcours", profile.discipleshipStage);
      line("Conversion", profile.conversionDate);
      line("Baptême", profile.baptismDate);
      line("Adhésion", profile.membershipDate);
      line("Mentor", profile.mentorName);
      line("Cellule / groupe", profile.smallGroup);
      line("Départements", profile.departments.join(", ") || "Aucune affectation");
      line("Formations", profile.trainings.join(", ") || "Aucune formation enregistrée");
      line("Objectif formation", profile.trainingGoal);

      section("Service et engagement");
      line("Dons / compétences", profile.spiritualGifts);
      line("Intérêts de service", profile.ministryInterests);
      line("Disponibilités", profile.volunteerAvailability);

      section("Engagement et accompagnement");
      line("Présences / 90 j", String(profile.attendanceCount90Days));
      line("Dernière présence", profile.lastAttendance);
      line("Suivis pastoraux", String(profile.pastoralFollowups));
      line("Prochain suivi", profile.nextFollowup);

      section("Notes administratives");
      const noteLines = doc.splitTextToSize(profile.notes || "Aucune note enregistrée.", pageWidth - margin * 2);
      ensureSpace(noteLines.length * 5 + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 5 + 7;

      ensureSpace(12);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Document généré le ${profile.generatedAt} • Mpangi Church`, margin, y);

      doc.save(`fiche-membre-${safeFilename(profile.fullName) || profile.memberCode}.pdf`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadProfile}
      disabled={isGenerating}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#082F57] shadow-sm transition hover:bg-blue-50 disabled:opacity-70"
    >
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {isGenerating ? "Préparation…" : "Télécharger la fiche PDF"}
    </button>
  );
}
