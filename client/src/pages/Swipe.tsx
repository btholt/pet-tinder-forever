import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { Pet } from "@shared/types";
import { AppLayout } from "@/components/AppLayout";
import { SwipeDeck } from "@/components/SwipeDeck";
import { MatchTakeover } from "@/components/MatchTakeover";

export function Swipe() {
  const navigate = useNavigate();
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);

  const handleMatch = useCallback((pet: Pet) => {
    setMatchedPet(pet);
  }, []);

  const dismissMatch = useCallback(() => setMatchedPet(null), []);

  return (
    <AppLayout>
      <SwipeDeck onMatch={handleMatch} />
      <MatchTakeover
        pet={matchedPet}
        onKeepSwiping={dismissMatch}
        onSeeMatches={() => {
          dismissMatch();
          navigate("/matches");
        }}
      />
    </AppLayout>
  );
}
