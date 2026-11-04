import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Nouveau bien" };

export default function NewPropertyPage() {
  return (
    <ComingSoon
      title="Nouveau bien"
      description="Parcours en 3 étapes : photos, informations du bien, puis génération des contenus par le Studio IA."
      plan="essentiel"
    />
  );
}
