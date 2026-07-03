export type FeedQuiz = {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
};

export type FeedItem = {
  id: string;
  title: string;
  caption: string;
  videoUrl: string;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  topic: { name: string; slug: string } | null;
  hashtags: { name: string; slug: string }[];
  likeCount: number;
  commentCount: number;
  quiz?: FeedQuiz | null;
  courseId?: string | null;
};

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

/** Raw quizzes row -> FeedQuiz (answer_choices stored as jsonb array) */
export function toFeedQuiz(
  q: {
    id: string;
    question: string;
    answer_choices: unknown;
    correct_answer: number;
  } | null
): FeedQuiz | null {
  if (!q) return null;
  const choices = Array.isArray(q.answer_choices)
    ? (q.answer_choices as string[])
    : [];
  if (choices.length < 2) return null;
  return {
    id: q.id,
    question: q.question,
    choices,
    correctAnswer: q.correct_answer,
  };
}
