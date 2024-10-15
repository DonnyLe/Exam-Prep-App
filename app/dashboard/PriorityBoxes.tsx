"use client";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FullSchedule, ConfidenceUpdates } from "@/lib/algorithm-types";
import { group } from "console";
import { useEffect, useState } from "react";
import { getStudyMaterialInfo } from "../schedule/algorithm/generateSchedule";

export default function PriorityBoxes({
  examGoals,
}: {
  examGoals: ConfidenceUpdates;
}) {
  //Math.min(Math.min(0, priority) * 30, 0)
  return (
    <div>
      {examGoals.childrenConfidenceUpdates ? (
        Array.from(examGoals.childrenConfidenceUpdates.entries())
          .sort(
            (a, b) =>
              (a[1].studyMaterial.priority ?? -20) -
              (b[1].studyMaterial.priority ?? -20)
          )
          .map(([childKey, childValue]) => (
            <div key={childKey}>
              {childValue.childrenConfidenceUpdates ? (
                Array.from(childValue.childrenConfidenceUpdates.entries())
                  .sort(
                    (a, b) =>
                      (a[1].studyMaterial.priority ?? -20) -
                      (b[1].studyMaterial.priority ?? -20)
                  )
                  .map(([grandchildKey, grandchildValue]) => (
                    <div key={grandchildKey}>
                      <div>{grandchildValue.studyMaterial.name}</div>
                      <div className="indent-4">
                        + {grandchildValue.confidenceIncrease}
                      </div>
                    </div>
                  ))
              ) : (
                <> </>
              )}
            </div>
          ))
      ) : (
        <> </>
      )}
    </div>
  );
}
