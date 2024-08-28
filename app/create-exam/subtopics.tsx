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
import { ExamFormData } from "@/lib/form-types";

import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import React from "react";

export default function SubTopicForm({
  topic_index,
  form,
}: {
  topic_index: number;
  form: UseFormReturn<ExamFormData, any, undefined>;
}) {
  const { fields, append, remove } = useFieldArray({
    name: `topics.${topic_index}.subtopics`,
    control: form.control,
  });

  return (
    <div>
      {fields.map((field, subtopics_index) => (
        <FormField
          key={field.id}
          control={form.control}
          name={`topics.${topic_index}.subtopics.${subtopics_index}.subtopic_name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtopic {subtopics_index + 1}</FormLabel>
              <FormControl>
                <Input placeholder="Subtopic Description" {...field} />
              </FormControl>
              <FormDescription>
                This is the description of your subtopic
              </FormDescription>
              <FormMessage />

              <Button
                type="button"
                onClick={() => {
                  remove(subtopics_index);
                }}
              >
                {" "}
                Delete sub-topic
              </Button>
            </FormItem>
          )}
        />
      ))}
      <Button
        type="button"
        onClick={() => {
          append({ subtopic_name: "" });
        }}
      >
        {" "}
        Add subtopic
      </Button>
    </div>
  );
}
