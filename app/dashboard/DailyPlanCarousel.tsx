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
            {value.map((exam, index) => (
              <Button
                onClick={() => {
                  updateCurrentPage(index );
                }}
              >
                Exam {index + 1}
              </Button>
            ))}
            <div>
              <div>{value[currentPage]?.studyMaterial.name}</div>
              <div>{value[currentPage]?.confidenceIncrease}</div>
              <div>
                {value[currentPage]?.childrenConfidenceUpdates ? (
                  Array.from(
                    value[currentPage].childrenConfidenceUpdates.entries()
                  ).map(([childKey, childValue]) => (
                    <div key={childKey}>
                      <div>{childValue.studyMaterial.name}</div>
                      <div className="indent-4">
                        + {childValue.confidenceIncrease}
                      </div>
                      <div>
                        {childValue.childrenConfidenceUpdates ? (
                          Array.from(
                            childValue.childrenConfidenceUpdates.entries()
                          ).map(([grandchildKey, grandchildValue]) => (
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
                    </div>
                  ))
                ) : (
                  <> </>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
