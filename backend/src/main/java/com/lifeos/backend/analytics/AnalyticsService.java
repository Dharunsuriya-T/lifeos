package com.lifeos.backend.analytics;

import com.lifeos.backend.analytics.dto.AnalyticsResponse;
import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.goal.GoalRepository;
import com.lifeos.backend.habit.Habit;
import com.lifeos.backend.habit.HabitLog;
import com.lifeos.backend.habit.HabitLogRepository;
import com.lifeos.backend.habit.HabitRepository;
import com.lifeos.backend.journal.Journal;
import com.lifeos.backend.journal.JournalRepository;
import com.lifeos.backend.learning.LearningItem;
import com.lifeos.backend.learning.LearningItemRepository;
import com.lifeos.backend.task.Task;
import com.lifeos.backend.task.TaskRepository;
import com.lifeos.backend.task.TaskStatus;
import com.lifeos.backend.user.User;
import com.lifeos.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final TaskRepository taskRepository;
    private final JournalRepository journalRepository;
    private final LearningItemRepository learningItemRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public AnalyticsResponse getAnalyticsData() {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        // 1. Calculate Habit Score (last 7 days compliance)
        List<Habit> habits = habitRepository.findByUser(user);
        double habitScore = 0.0;
        boolean habitActive = !habits.isEmpty();
        if (habitActive) {
            long totalPossibleLogs = habits.size() * 7L;
            long actualCompletions = 0;
            for (Habit habit : habits) {
                actualCompletions += habitLogRepository.findByHabit(habit).stream()
                        .filter(l -> l.isCompleted() && !l.getCompletedDate().isBefore(today.minusDays(6)) && !l.getCompletedDate().isAfter(today))
                        .count();
            }
            habitScore = ((double) actualCompletions / totalPossibleLogs) * 100;
        }

        // 2. Calculate Task Score
        List<Task> tasks = taskRepository.findByUser(user);
        double taskScore = 0.0;
        boolean taskActive = !tasks.isEmpty();
        if (taskActive) {
            long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            taskScore = ((double) completed / tasks.size()) * 100;
        }

        // 3. Calculate Journal Score (entries in last 7 days)
        List<Journal> journals = journalRepository.findByUser(user);
        double journalScore = 0.0;
        boolean journalActive = !journals.isEmpty();
        long journalCountLast7Days = 0;
        if (journalActive) {
            journalCountLast7Days = journals.stream()
                    .filter(j -> !j.getEntryDate().isBefore(today.minusDays(6)) && !j.getEntryDate().isAfter(today))
                    .count();
            journalScore = (journalCountLast7Days / 7.0) * 100;
            if (journalScore > 100.0) {
                journalScore = 100.0;
            }
        }

        // 4. Calculate Learning Score
        List<LearningItem> learningItems = learningItemRepository.findByUser(user);
        double learningScore = 0.0;
        boolean learningActive = !learningItems.isEmpty();
        if (learningActive) {
            learningScore = learningItems.stream()
                    .mapToInt(LearningItem::getProgressPercentage)
                    .average()
                    .orElse(0.0);
        }

        // Composite Growth Score (Dynamic Weights)
        double sumWeights = 0.0;
        double weightedScoreSum = 0.0;

        if (habitActive) {
            sumWeights += 0.40;
            weightedScoreSum += habitScore * 0.40;
        }
        if (taskActive) {
            sumWeights += 0.25;
            weightedScoreSum += taskScore * 0.25;
        }
        if (journalActive) {
            sumWeights += 0.15;
            weightedScoreSum += journalScore * 0.15;
        }
        if (learningActive) {
            sumWeights += 0.20;
            weightedScoreSum += learningScore * 0.20;
        }

        int growthScore = 0;
        if (sumWeights > 0.0) {
            growthScore = (int) Math.round(weightedScoreSum / sumWeights);
            growthScore = Math.max(0, Math.min(100, growthScore));
        }

        // 5. Goal Completion Estimates
        Map<String, Integer> goalCompletionEstimates = new HashMap<>();
        List<Goal> goals = goalRepository.findByUser(user);
        for (Goal goal : goals) {
            if (goal.getStatus() == com.lifeos.backend.goal.GoalStatus.COMPLETED) {
                goalCompletionEstimates.put(goal.getTitle(), 0);
                continue;
            }

            List<Task> goalTasks = tasks.stream()
                    .filter(t -> t.getGoal() != null && t.getGoal().getId().equals(goal.getId()))
                    .collect(Collectors.toList());

            if (goalTasks.isEmpty()) {
                goalCompletionEstimates.put(goal.getTitle(), 30); // Default placeholder
                continue;
            }

            long completedGoalTasks = goalTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            long remainingGoalTasks = goalTasks.size() - completedGoalTasks;

            if (remainingGoalTasks == 0) {
                goalCompletionEstimates.put(goal.getTitle(), 0);
                continue;
            }

            // Rate of task completion in last 14 days
            long completedInLast14Days = goalTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE && t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(LocalDateTime.now().minusDays(14)))
                    .count();

            double tasksPerDay = completedInLast14Days / 14.0;
            if (tasksPerDay <= 0) {
                tasksPerDay = 0.1; // Fallback: 1 task every 10 days
            }

            int estimatedDays = (int) Math.ceil(remainingGoalTasks / tasksPerDay);
            goalCompletionEstimates.put(goal.getTitle(), estimatedDays);
        }

        // 6. Growth Trends (last 6 weeks)
        List<AnalyticsResponse.TrendDto> trends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            String label = "Wk -" + i;
            if (i == 0) label = "This Wk";
            LocalDate dateAtWk = today.minusDays(i * 7L);
            int weeklyScore = calculateGrowthScoreForDate(habits, tasks, journals, learningItems, dateAtWk);
            trends.add(new AnalyticsResponse.TrendDto(label, weeklyScore));
        }

        // 7. Reflection Insights
        List<String> insights = new ArrayList<>();
        insights.add("Your composite Growth Score is " + growthScore + "% this week. You are making steady progress.");

        if (habitActive) {
            if (habitScore > 80) {
                insights.add("Excellent habit consistency! You completed " + (int) habitScore + "% of your habits this week.");
            } else {
                insights.add("Increasing your daily habit completions can significantly accelerate your growth score.");
            }
        }

        if (journalCountLast7Days >= 5) {
            insights.add("High reflection rate: You journaled " + journalCountLast7Days + " times in the last 7 days. This contributes to high emotional self-awareness.");
        } else {
            insights.add("Try journaling at least 3 times a week to build reflection insights.");
        }

        // Mood/Energy correlations
        if (journalActive) {
            double avgMood = journals.stream()
                    .mapToDouble(j -> {
                        try {
                            return Double.parseDouble(j.getMood());
                        } catch (Exception e) {
                            return 3.0; // Default to neutral
                        }
                    }).average().orElse(3.0);
            insights.add("Your average mood score is " + String.format("%.1f", avgMood) + "/5. Streaks are stable.");
        }

        return new AnalyticsResponse(
                growthScore,
                goalCompletionEstimates,
                trends,
                insights
        );
    }

    private int calculateGrowthScoreForDate(
            List<Habit> habits,
            List<Task> tasks,
            List<Journal> journals,
            List<LearningItem> learningItems,
            LocalDate date
    ) {
        // 1. Habit Score
        List<Habit> activeHabits = habits.stream()
                .filter(h -> h.getCreatedAt() == null || !h.getCreatedAt().toLocalDate().isAfter(date))
                .collect(Collectors.toList());
        double habitScore = 0.0;
        boolean habitActive = !activeHabits.isEmpty();
        if (habitActive) {
            long totalPossibleLogs = activeHabits.size() * 7L;
            long actualCompletions = 0;
            for (Habit habit : activeHabits) {
                actualCompletions += habitLogRepository.findByHabit(habit).stream()
                        .filter(l -> l.isCompleted() && !l.getCompletedDate().isBefore(date.minusDays(6)) && !l.getCompletedDate().isAfter(date))
                        .count();
            }
            habitScore = ((double) actualCompletions / totalPossibleLogs) * 100;
        }

        // 2. Task Score
        List<Task> activeTasks = tasks.stream()
                .filter(t -> t.getCreatedAt() == null || !t.getCreatedAt().toLocalDate().isAfter(date))
                .collect(Collectors.toList());
        double taskScore = 0.0;
        boolean taskActive = !activeTasks.isEmpty();
        if (taskActive) {
            long completed = activeTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE && (t.getUpdatedAt() == null || !t.getUpdatedAt().toLocalDate().isAfter(date)))
                    .count();
            taskScore = ((double) completed / activeTasks.size()) * 100;
        }

        // 3. Journal Score
        List<Journal> activeJournals = journals.stream()
                .filter(j -> j.getCreatedAt() == null || !j.getCreatedAt().toLocalDate().isAfter(date))
                .collect(Collectors.toList());
        double journalScore = 0.0;
        boolean journalActive = !activeJournals.isEmpty();
        if (journalActive) {
            long journalCountLast7Days = activeJournals.stream()
                    .filter(j -> !j.getEntryDate().isBefore(date.minusDays(6)) && !j.getEntryDate().isAfter(date))
                    .count();
            journalScore = (journalCountLast7Days / 7.0) * 100;
            if (journalScore > 100.0) {
                journalScore = 100.0;
            }
        }

        // 4. Learning Score
        List<LearningItem> activeLearning = learningItems.stream()
                .filter(item -> item.getCreatedAt() == null || !item.getCreatedAt().toLocalDate().isAfter(date))
                .collect(Collectors.toList());
        double learningScore = 0.0;
        boolean learningActive = !activeLearning.isEmpty();
        if (learningActive) {
            learningScore = activeLearning.stream()
                    .mapToInt(item -> {
                        if (item.getUpdatedAt() != null && item.getUpdatedAt().toLocalDate().isAfter(date)) {
                            return 0;
                        }
                        return item.getProgressPercentage();
                    })
                    .average()
                    .orElse(0.0);
        }

        // Calculate dynamic weights
        double sumWeights = 0.0;
        double weightedScoreSum = 0.0;

        if (habitActive) {
            sumWeights += 0.40;
            weightedScoreSum += habitScore * 0.40;
        }
        if (taskActive) {
            sumWeights += 0.25;
            weightedScoreSum += taskScore * 0.25;
        }
        if (journalActive) {
            sumWeights += 0.15;
            weightedScoreSum += journalScore * 0.15;
        }
        if (learningActive) {
            sumWeights += 0.20;
            weightedScoreSum += learningScore * 0.20;
        }

        if (sumWeights == 0.0) {
            return 0;
        }

        int score = (int) Math.round(weightedScoreSum / sumWeights);
        return Math.max(0, Math.min(100, score));
    }
}
