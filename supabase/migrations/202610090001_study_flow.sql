-- Additive migration: retain existing exams, material and confidence histories.
create table if not exists public.study_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  material_id uuid not null,
  material_type text not null check (material_type in ('topics','subtopics')),
  confidence_before numeric not null check (confidence_before between 0 and 10),
  confidence_after numeric not null check (confidence_after between 0 and 10),
  studied_on date not null,
  elapsed_seconds integer not null default 0 check (elapsed_seconds between 0 and 86400),
  created_at timestamptz not null default now()
);
alter table public.study_sessions enable row level security;
create policy "Read own study sessions" on public.study_sessions for select to authenticated using (user_id = auth.uid());

create or replace function public.complete_study_session(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  owner uuid := auth.uid(); exam public.exams%rowtype;
  before_value numeric; after_value numeric := (p->>'confidence')::numeric;
  material uuid := (p->>'material_id')::uuid; topic uuid;
  session_id uuid := (p->>'id')::uuid; study_date date := (p->>'studied_on')::date;
  previous_topic numeric; previous_exam numeric;
begin
  if owner is null then raise exception 'Sign in to save progress'; end if;
  select * into exam from public.exams where id = (p->>'exam_id')::uuid and user_id = owner for update;
  if not found then raise exception 'Exam not found'; end if;
  if exists (select 1 from public.study_sessions where id = session_id and user_id = owner) then return session_id; end if;
  if after_value is null or after_value < 0 or after_value > 10 or study_date > current_date + 1 or study_date < current_date - 1 then raise exception 'Invalid session'; end if;
  previous_exam := coalesce(exam.confidence,3);
  if p->>'material_type' = 'subtopics' then
    select s.confidence,t.id,coalesce(t.confidence,3) into before_value,topic,previous_topic from public.subtopics s join public.topics t on t.id = s.topic_id where s.id = material and t.exam_id = exam.id for update of s,t;
    if not found then raise exception 'Material not found'; end if;
    update public.subtopics set confidence = after_value,last_studied = study_date,priority = 70/(after_value+5)+1 where id = material;
    insert into public.studied_subtopic_entry (subtopic_id,confidence_increase,date_studied) values (material,after_value-coalesce(before_value,3),study_date);
    update public.topics set confidence = (select avg(coalesce(confidence,3)) from public.subtopics where topic_id = topic),last_studied = study_date where id = topic;
    insert into public.studied_topic_entry (topic_id,confidence_increase,date_studied) select topic,confidence-previous_topic,study_date from public.topics where id=topic;
  elsif p->>'material_type' = 'topics' then
    select confidence,id into before_value,topic from public.topics where id = material and exam_id = exam.id and not exists (select 1 from public.subtopics where topic_id = material) for update;
    if not found then raise exception 'Study a subtopic or choose an existing topic'; end if;
    update public.topics set confidence = after_value,last_studied = study_date where id = material;
    insert into public.studied_topic_entry (topic_id,confidence_increase,date_studied) values (material,after_value-coalesce(before_value,3),study_date);
  else raise exception 'Invalid material type'; end if;
  update public.topics set priority = 70/(coalesce(confidence,3)+5)+1 where id = topic;
  update public.exams set confidence = (select avg(coalesce(confidence,3)) from public.topics where exam_id=exam.id),last_studied=study_date where id=exam.id;
  update public.exams set priority = 70/(coalesce(confidence,3)+5)+1 where id=exam.id;
  insert into public.studied_exam_entry (exam_id,user_id,confidence_increase,date_studied) select exam.id,owner,confidence-previous_exam,study_date from public.exams where id=exam.id;
  insert into public.study_sessions(id,user_id,exam_id,material_id,material_type,confidence_before,confidence_after,studied_on,elapsed_seconds)
  values(session_id,owner,exam.id,material,p->>'material_type',coalesce(before_value,3),after_value,study_date,(p->>'elapsed_seconds')::integer);
  return session_id;
end $$;

create or replace function public.save_study_exam(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare owner uuid := auth.uid(); exam_id_value uuid; subject uuid; t jsonb; s jsonb; topic uuid; subtopic uuid; position integer := 0; subposition integer;
begin
  if owner is null then raise exception 'Sign in to save exams'; end if;
  if length(trim(p->>'name')) = 0 or (p->>'confidence_goal')::numeric not between 0 and 10 or jsonb_array_length(p->'topics') < 1 or jsonb_array_length(p->'topics') > 50 or (p->>'exam_date')::date <= current_date then raise exception 'Invalid exam'; end if;
  insert into public.profiles(id) values(owner) on conflict(id) do nothing;
  if p->>'id' is not null then
    select id into exam_id_value from public.exams where id=(p->>'id')::uuid and user_id=owner for update;
    if not found then raise exception 'Exam not found'; end if;
  end if;
  if p->>'subject_id' is not null then
    select id into subject from public.subjects where id=(p->>'subject_id')::uuid and user_id=owner;
    if not found then raise exception 'Subject not found'; end if;
  else
    if length(trim(p->>'subject_name')) = 0 then raise exception 'Enter a subject'; end if;
    insert into public.subjects(subject_name,user_id) values(trim(p->>'subject_name'),owner) returning id into subject;
  end if;
  if exam_id_value is null then
    insert into public.exams(name,subject_id,user_id,exam_date,confidence_goal,confidence,last_studied) values(trim(p->>'name'),subject,owner,(p->>'exam_date')::date,(p->>'confidence_goal')::numeric,3,current_date) returning id into exam_id_value;
  else update public.exams set name=trim(p->>'name'),subject_id=subject,exam_date=(p->>'exam_date')::date,confidence_goal=(p->>'confidence_goal')::numeric where id=exam_id_value; end if;
  for t in select value from jsonb_array_elements(p->'topics') loop
    if length(trim(t->>'name')) = 0 or (t->>'confidence')::numeric not between 0 and 10 or jsonb_array_length(t->'subtopics') > 50 then raise exception 'Invalid topic'; end if;
    if t->>'id' is not null then
      select id into topic from public.topics where id=(t->>'id')::uuid and exam_id=exam_id_value;
      if not found then raise exception 'Topic not found'; end if;
      update public.topics set name=trim(t->>'name'),confidence=(t->>'confidence')::numeric,"order"=position where id=topic;
    else insert into public.topics(name,exam_id,confidence,last_studied,"order") values(trim(t->>'name'),exam_id_value,(t->>'confidence')::numeric,current_date,position) returning id into topic; end if;
    subposition := 0;
    for s in select value from jsonb_array_elements(t->'subtopics') loop
      if length(trim(s->>'name')) = 0 or (s->>'confidence')::numeric not between 0 and 10 then raise exception 'Invalid subtopic'; end if;
      if s->>'id' is not null then
        select id into subtopic from public.subtopics where id=(s->>'id')::uuid and topic_id=topic;
        if not found then raise exception 'Subtopic not found'; end if;
        update public.subtopics set name=trim(s->>'name'),confidence=(s->>'confidence')::numeric,"order"=subposition where id=subtopic;
      else insert into public.subtopics(name,topic_id,confidence,last_studied,"order") values(trim(s->>'name'),topic,(s->>'confidence')::numeric,current_date,subposition); end if;
      subposition := subposition+1;
    end loop;
    if exists (select 1 from public.subtopics where topic_id=topic) then update public.topics set confidence=(select avg(coalesce(confidence,3)) from public.subtopics where topic_id=topic) where id=topic; end if;
    position := position+1;
  end loop;
  update public.exams set confidence=(select avg(coalesce(confidence,3)) from public.topics where exam_id=exam_id_value) where id=exam_id_value;
  return exam_id_value;
end $$;
revoke all on function public.save_study_exam(jsonb) from public,anon;
revoke all on function public.complete_study_session(jsonb) from public,anon;
grant execute on function public.save_study_exam(jsonb) to authenticated;
grant execute on function public.complete_study_session(jsonb) to authenticated;
grant select on public.study_sessions to authenticated;
