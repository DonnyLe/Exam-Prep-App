"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { createClient } from "@/utils/supabase/client";

import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import React from "react";
import TopicForm from "../topics";
import { examFormSchema, ExamFormData, Subjects } from "@/lib/form-types";
import { addExam } from "@/app/actions";
import { fetchSubjects } from "@/app/queries";

export default function SelectForm({
  params,
}: {
  params: { user_id: string };
}) {
  const onSubmit = async (data: ExamFormData) => {
    console.log("entered 2");
    await addExam(data, params.user_id);
  };

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
  });
  const supabase = createClient();
  let [subjects, setSubjects] = useState<Subjects[]>([]);
  let [new_subject, setNewSubject] = useState("");

  const getSubjects = async () => {
    const subjects = await fetchSubjects(supabase, params.user_id);
    setSubjects(subjects);
  };

  useEffect(() => {
    getSubjects();
  }, []);

  let addSubject = async () => {
    if (new_subject) {
      let subject_id = await supabase
        .from("subjects")
        .insert([{ subject_name: new_subject, user_id: params.user_id }])
        .select("id");
      getSubjects();
    }
  };

  return (
    <div className="flex justify-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-5/6 space-y-6 flex flex-col h-screen"
        >
          <FormField
            control={form.control}
            name="subject_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Subject</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subjects.map((field, value) => (
                      <SelectItem value={`${field.id}`}>
                        {field.subject_name}
                      </SelectItem>
                    ))}

                    <Input
                      onChange={(e) => setNewSubject(e.target.value)}
                      type="text"
                      placeholder="Enter new subject name"
                    />

                    <Button onClick={addSubject} className="w-full">
                      Add subject
                    </Button>
                  </SelectContent>
                </Select>
                <FormDescription>Form description</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exam_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Name</FormLabel>
                <FormControl>
                  <Input placeholder="Exam Name" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name of your exam.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exam_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"}>
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The date of the exam</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <TopicForm form={form} />

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
