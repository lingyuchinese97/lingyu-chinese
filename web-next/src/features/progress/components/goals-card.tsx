"use client";
import * as React from "react";
import { BookOpen, CheckCircle2, Circle, Clock3, GraduationCap, Loader2, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { GOAL_KINDS, GOAL_LIMITS, type GoalKind } from "../constants";
import { setGoalsAction } from "../actions";

type Goals = Record<GoalKind, { target: number; value: number }>;
const ICON: Record<GoalKind, React.ComponentType<{ className?: string }>> = {
  minutes_day: Clock3,
  lessons_week: GraduationCap,
  vocab_month: BookOpen,
};

/** Mục tiêu học tập: 3 mục tiêu + tiến độ; sửa trong hộp thoại. */
export function GoalsCard({ goals: initial }: { goals: Goals }) {
  const t = useT();
  const [goals, setGoals] = React.useState(initial);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<GoalKind, string>>(
    () => Object.fromEntries(GOAL_KINDS.map((k) => [k, String(initial[k].target)])) as Record<GoalKind, string>,
  );
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    const r = await setGoalsAction(Object.fromEntries(GOAL_KINDS.map((k) => [k, Number(draft[k])])));
    setSaving(false);
    if (!r.ok) return void toast.error(r.message);
    setGoals((g) => Object.fromEntries(GOAL_KINDS.map((k) => [k, { ...g[k], target: r.data[k] }])) as Goals);
    toast.success(t("progress.goalsSaved"));
    setOpen(false);
  }

  return (
    <section
      aria-labelledby="pg-goals"
      className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5"
    >
      <div className="flex items-center gap-2">
        <Target className="size-6 text-rose" aria-hidden="true" />
        <h2 id="pg-goals" className="mr-auto text-[18px] font-bold text-navy-900">
          {t("progress.goals")}
        </h2>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            setDraft(
              Object.fromEntries(GOAL_KINDS.map((k) => [k, String(goals[k].target)])) as Record<GoalKind, string>,
            );
            setOpen(true);
          }}
        >
          {t("progress.editGoals")}
        </Button>
      </div>
      <ul className="flex flex-col gap-2.5">
        {GOAL_KINDS.map((k) => {
          const g = goals[k];
          const pct = Math.min(100, Math.round((g.value / g.target) * 100));
          const done = g.value >= g.target;
          const Icon = ICON[k];
          return (
            <li key={k} className="flex items-center gap-3 rounded-[16px] border border-border p-3">
              <Icon className="size-7 shrink-0 text-[#F07A1A]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold text-navy-900">
                  {t(`progress.goal.${k}`, { target: g.target })}
                </p>
                <p className="text-[13px] text-text-2">
                  {t(`progress.goalValue.${k}`, { value: g.value, target: g.target })}
                </p>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-blue-50"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label={t(`progress.goal.${k}`, { target: g.target })}
                >
                  <div
                    className={done ? "h-full rounded-full bg-green" : "h-full rounded-full bg-blue"}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {done ? (
                <CheckCircle2 className="size-6 shrink-0 text-green" aria-label={t("progress.goalDone")} />
              ) : (
                <Circle className="size-6 shrink-0 text-border-strong" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t("progress.goalsTitle")} icon={<Target />}>
          {GOAL_KINDS.map((k) => (
            <Field key={k} id={`goal-${k}`} label={t(`progress.goalField.${k}`)}>
              <Input
                id={`goal-${k}`}
                type="number"
                inputMode="numeric"
                min={GOAL_LIMITS[k][0]}
                max={GOAL_LIMITS[k][1]}
                value={draft[k]}
                onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
              />
            </Field>
          ))}
          <DialogActions>
            <DialogClose asChild>
              <Button variant="secondary">{t("common.cancel")}</Button>
            </DialogClose>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {t("progress.save")}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </section>
  );
}
