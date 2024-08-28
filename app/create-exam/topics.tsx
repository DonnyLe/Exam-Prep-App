"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import React from "react";
import SubTopicForm from "./subtopics";
import { examFormSchema, ExamFormData } from "@/lib/form-types";

export default function TopicForm({
  form,
}: {
  form: UseFormReturn<ExamFormData, any, undefined>;
}) {
  const { fields, append, remove } = useFieldArray({
    name: "topics",
    control: form.control,
  });

  return (
    <div className="grow overflow-y-auto flex justify-center ">
      <div className="w-11/12">
        <Carousel>
          <CarouselContent>
            {fields.map((field, topic_index) => (
              <CarouselItem key={field.id}>
                <FormField
                  control={form.control}
                  name={`topics.${topic_index}.topic_name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Topic Name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the name of your exam.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SubTopicForm topic_index={topic_index} form={form} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <Button
          type="button"
          onClick={() => append({ topic_name: "", subtopics: [] })}
        >
          {" "}
          Add Topic
        </Button>
      </div>
    </div>
  );
}
