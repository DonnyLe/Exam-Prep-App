"use client";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FullSchedule } from "@/lib/algorithm-types";
import { useState } from "react";

export default function DailyPlanCarousel({
  full_schedule,
}: {
  full_schedule: FullSchedule;
}) {
  const [currentPage, updateCurrentPage] = useState(0);

  console.log(full_schedule);

  return (
    <Carousel className="w-1/2 h-1/2">
      <CarouselContent>
        {Array.from(full_schedule).map(([key, value]) => (
          <CarouselItem key={key}>
            <div>Date: {key}</div>
            {value != null ? (
              <div>
                {value.map((exam, index) => (
                  <Button
                    key={index}
                    onClick={() => {
                      updateCurrentPage(index);
                    }}
                  >
                    Exam {index + 1}
                  </Button>
                ))}

                <div>
                  <div>{value[currentPage]?.studyMaterial.name}</div>
                  <div>{value[currentPage]?.confidenceIncrease}</div>

                  {value[currentPage]?.childrenConfidenceUpdates ? (
                    <div>
                      {Array.from(
                        value[currentPage]?.childrenConfidenceUpdates?.entries() ?? []
                      ).map(([childKey, childValue]) => (
                        <div key={childKey}>
                          <div>{childValue.studyMaterial.name}</div>
                          <div className="indent-4">+ {childValue.confidenceIncrease}</div>

                          {childValue.childrenConfidenceUpdates ? (
                            <div>
                              {Array.from(
                                childValue.childrenConfidenceUpdates.entries() ?? []
                              ).map(([grandchildKey, grandchildValue]) => (
                                <div key={grandchildKey}>
                                  <div>{grandchildValue.studyMaterial.name}</div>
                                  <div className="indent-4">
                                    + {grandchildValue.confidenceIncrease}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
