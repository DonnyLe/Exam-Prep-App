'use client'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


export default function DailyPlanCarousel() {
  


  return (
  <Carousel className="w-1/2 h-1/2"> 
            <CarouselContent>
              <CarouselItem>Placeholder</CarouselItem>
              <CarouselItem>Placeholder</CarouselItem>
              <CarouselItem>Placeholder</CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>);
}