create table if not exists vocabulary_words (
  id bigserial primary key,
  book_id bigint not null,
  unit_id bigint not null,
  word text not null,
  phonetic text,
  meaning text not null,
  audio_url text,
  example_en text,
  example_cn text,
  image_url text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_vocabulary_words_book_unit_sort
  on vocabulary_words (book_id, unit_id, sort, id);

create table if not exists user_word_progress (
  id bigserial primary key,
  user_id uuid not null,
  word_id bigint not null references vocabulary_words(id) on delete cascade,
  learned boolean not null default false,
  choose_passed boolean not null default false,
  spell_passed boolean not null default false,
  mastery integer not null default 0,
  wrong_count integer not null default 0,
  last_studied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, word_id)
);

create index if not exists idx_user_word_progress_user_word
  on user_word_progress (user_id, word_id);
