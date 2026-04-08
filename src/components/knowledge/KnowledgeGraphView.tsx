"use client";

import { useState } from "react";
import ThreePanelLayout from "@/components/ThreePanelLayout";
import PersonTree from "@/components/knowledge/PersonTree";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import PersonDetailPanel from "@/components/knowledge/PersonDetailPanel";

type OwnerEntry = { id: string; name: string; role: "pm" | "tech" };
type Person = {
  name:     string;
  modules:  OwnerEntry[];
  features: OwnerEntry[];
};

type Props = { people: Person[] };

export default function KnowledgeGraphView({ people }: Props) {
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const selectedPerson = people.find((p) => p.name === selectedName) ?? null;

  function handleSelect(name: string) {
    setSelectedName((prev) => prev === name ? null : name);
  }

  return (
    <ThreePanelLayout
      leftTitle="Personas"
      rightTitle="Detalle"
      left={
        <PersonTree
          people={people}
          selectedName={selectedName}
          onSelect={handleSelect}
        />
      }
      center={
        <KnowledgeGraph
          people={people}
          highlightName={selectedName}
          onPersonClick={handleSelect}
        />
      }
      right={
        <PersonDetailPanel person={selectedPerson} />
      }
    />
  );
}