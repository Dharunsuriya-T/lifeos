package com.lifeos.backend.dashboard;

import com.lifeos.backend.dashboard.dto.DashboardResponse;
import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.goal.GoalRepository;
import com.lifeos.backend.habit.Habit;
import com.lifeos.backend.habit.HabitLog;
import com.lifeos.backend.habit.HabitLogRepository;
import com.lifeos.backend.habit.HabitRepository;
import com.lifeos.backend.journal.Journal;
import com.lifeos.backend.journal.JournalRepository;
import com.lifeos.backend.project.Project;
import com.lifeos.backend.project.ProjectRepository;
import com.lifeos.backend.roadmap.RoadmapNode;
import com.lifeos.backend.roadmap.RoadmapNodeRepository;
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
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final JournalRepository journalRepository;
    private final RoadmapNodeRepository roadmapNodeRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public DashboardResponse getDashboardData() {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(LocalTime.MAX);

        // Tasks
        List<Task> allTasks = taskRepository.findByUser(user);
        long todayTasksCount = allTasks.stream()
                .filter(t -> t.getDueDate() != null && !t.getDueDate().toLocalDate().isAfter(today) && t.getStatus() != TaskStatus.DONE)
                .count();

        long completedTasksToday = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(todayStart) && t.getUpdatedAt().isBefore(todayEnd))
                .count();

        // Goals
        List<Goal> goals = goalRepository.findByUser(user);
        long activeGoals = goals.stream().filter(g -> g.getStatus() != com.lifeos.backend.goal.GoalStatus.COMPLETED).count();
        int averageGoalProgress = goals.isEmpty() ? 0 :
                (int) goals.stream().mapToInt(Goal::getProgressPercentage).average().orElse(0.0);

        // Projects
        List<Project> projects = projectRepository.findByUser(user);
        long activeProjects = projects.stream().filter(p -> p.getStatus() != com.lifeos.backend.project.ProjectStatus.COMPLETED).count();

        // Habits Completion Rate
        List<Habit> habits = habitRepository.findByUser(user);
        int habitRate = 0;
        if (!habits.isEmpty()) {
            long completedHabitsCount = habits.stream()
                    .filter(h -> {
                        Optional<HabitLog> log = habitLogRepository.findByHabitAndCompletedDate(h, today);
                        return log.isPresent() && log.get().isCompleted();
                    }).count();
            habitRate = (int) (((double) completedHabitsCount / habits.size()) * 100);
        }

        // Journal Streak
        List<Journal> journals = journalRepository.findByUser(user);
        int journalStreak = calculateJournalStreak(journals, today);

        // Upcoming Deadlines (next 7 days)
        LocalDateTime nextWeek = LocalDateTime.now().plusDays(7);
        List<DashboardResponse.DeadlineDto> deadlines = new ArrayList<>();

        // 1. Task Deadlines
        allTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isAfter(LocalDateTime.now()) && t.getDueDate().isBefore(nextWeek) && t.getStatus() != TaskStatus.DONE)
                .forEach(t -> deadlines.add(new DashboardResponse.DeadlineDto(t.getTitle(), "TASK", t.getDueDate())));

        // 2. Project Deadlines
        projects.stream()
                .filter(p -> p.getDeadline() != null && p.getDeadline().isAfter(LocalDateTime.now()) && p.getDeadline().isBefore(nextWeek) && p.getStatus() != com.lifeos.backend.project.ProjectStatus.COMPLETED)
                .forEach(p -> deadlines.add(new DashboardResponse.DeadlineDto(p.getTitle(), "PROJECT", p.getDeadline())));

        // 3. Roadmap Node Deadlines
        // Fetch all roadmap nodes for the user's roadmaps
        roadmapNodeRepository.findByUserAndUpdatedAtAfter(user, LocalDateTime.now().minusYears(10)).stream()
                .filter(rn -> rn.getDeadline() != null && rn.getDeadline().isAfter(LocalDateTime.now()) && rn.getDeadline().isBefore(nextWeek) && rn.getStatus() != com.lifeos.backend.roadmap.RoadmapNodeStatus.COMPLETED)
                .forEach(rn -> deadlines.add(new DashboardResponse.DeadlineDto(rn.getTitle(), "ROADMAP_NODE", rn.getDeadline())));

        // Sort deadlines ascending
        deadlines.sort(Comparator.comparing(DashboardResponse.DeadlineDto::deadline));

        return new DashboardResponse(
                todayTasksCount,
                completedTasksToday,
                activeGoals,
                averageGoalProgress,
                habitRate,
                journalStreak,
                activeProjects,
                deadlines
        );
    }

    private int calculateJournalStreak(List<Journal> journals, LocalDate today) {
        if (journals.isEmpty()) return 0;

        Set<LocalDate> dates = journals.stream()
                .map(Journal::getEntryDate)
                .collect(Collectors.toSet());

        int streak = 0;
        LocalDate current = today;

        if (!dates.contains(current)) {
            current = today.minusDays(1);
        }

        while (dates.contains(current)) {
            streak++;
            current = current.minusDays(1);
        }

        return streak;
    }
}
