package com.lifeos.backend.sync;

import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.goal.GoalRepository;
import com.lifeos.backend.goal.GoalStatus;
import com.lifeos.backend.habit.Habit;
import com.lifeos.backend.habit.HabitLog;
import com.lifeos.backend.habit.HabitLogRepository;
import com.lifeos.backend.habit.HabitRepository;
import com.lifeos.backend.journal.Journal;
import com.lifeos.backend.journal.JournalRepository;
import com.lifeos.backend.learning.LearningItem;
import com.lifeos.backend.learning.LearningItemRepository;
import com.lifeos.backend.note.Note;
import com.lifeos.backend.note.NoteRepository;
import com.lifeos.backend.project.Project;
import com.lifeos.backend.project.ProjectMilestone;
import com.lifeos.backend.project.ProjectMilestoneRepository;
import com.lifeos.backend.project.ProjectRepository;
import com.lifeos.backend.roadmap.Roadmap;
import com.lifeos.backend.roadmap.RoadmapNode;
import com.lifeos.backend.roadmap.RoadmapNodeRepository;
import com.lifeos.backend.roadmap.RoadmapRepository;
import com.lifeos.backend.roadmap.RoadmapNodeStatus;
import com.lifeos.backend.sync.dto.*;
import com.lifeos.backend.task.Task;
import com.lifeos.backend.task.TaskRepository;
import com.lifeos.backend.user.User;
import com.lifeos.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final RoadmapRepository roadmapRepository;
    private final RoadmapNodeRepository roadmapNodeRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final LearningItemRepository learningItemRepository;
    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;
    private final JournalRepository journalRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Transactional
    public SyncResponse sync(SyncRequest request) {
        User user = getCurrentUser();
        LocalDateTime serverSyncTime = LocalDateTime.now();

        // 1. Process Goals
        if (request.goals() != null) {
            for (GoalDto dto : request.goals()) {
                Optional<Goal> existing = goalRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Goal goal = existing.get();
                    if (dto.updatedAt().isAfter(goal.getUpdatedAt())) {
                        updateGoalFields(goal, dto);
                        goalRepository.save(goal);
                    }
                } else {
                    Goal goal = new Goal();
                    goal.setId(dto.id());
                    goal.setUser(user);
                    updateGoalFields(goal, dto);
                    goalRepository.save(goal);
                }
            }
        }

        // 2. Process Roadmaps
        if (request.roadmaps() != null) {
            for (RoadmapDto dto : request.roadmaps()) {
                Optional<Roadmap> existing = roadmapRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Roadmap roadmap = existing.get();
                    if (dto.updatedAt().isAfter(roadmap.getUpdatedAt())) {
                        updateRoadmapFields(roadmap, dto);
                        roadmapRepository.save(roadmap);
                    }
                } else {
                    Roadmap roadmap = new Roadmap();
                    roadmap.setId(dto.id());
                    roadmap.setUser(user);
                    updateRoadmapFields(roadmap, dto);
                    roadmapRepository.save(roadmap);
                }
            }
        }

        // 3. Process Roadmap Nodes
        if (request.roadmapNodes() != null) {
            for (RoadmapNodeDto dto : request.roadmapNodes()) {
                Optional<RoadmapNode> existing = roadmapNodeRepository.findById(dto.id());
                if (existing.isPresent()) {
                    RoadmapNode node = existing.get();
                    if (dto.updatedAt().isAfter(node.getUpdatedAt())) {
                        updateRoadmapNodeFields(node, dto);
                        roadmapNodeRepository.save(node);
                    }
                } else {
                    RoadmapNode node = new RoadmapNode();
                    node.setId(dto.id());
                    updateRoadmapNodeFields(node, dto);
                    roadmapNodeRepository.save(node);
                }
            }
        }

        // 4. Process Projects
        if (request.projects() != null) {
            for (ProjectDto dto : request.projects()) {
                Optional<Project> existing = projectRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Project project = existing.get();
                    if (dto.updatedAt().isAfter(project.getUpdatedAt())) {
                        updateProjectFields(project, dto);
                        projectRepository.save(project);
                    }
                } else {
                    Project project = new Project();
                    project.setId(dto.id());
                    project.setUser(user);
                    updateProjectFields(project, dto);
                    projectRepository.save(project);
                }
            }
        }

        // 5. Process Project Milestones
        if (request.projectMilestones() != null) {
            for (ProjectMilestoneDto dto : request.projectMilestones()) {
                Optional<ProjectMilestone> existing = projectMilestoneRepository.findById(dto.id());
                if (existing.isPresent()) {
                    ProjectMilestone milestone = existing.get();
                    if (dto.updatedAt().isAfter(milestone.getUpdatedAt())) {
                        updateProjectMilestoneFields(milestone, dto);
                        projectMilestoneRepository.save(milestone);
                    }
                } else {
                    ProjectMilestone milestone = new ProjectMilestone();
                    milestone.setId(dto.id());
                    updateProjectMilestoneFields(milestone, dto);
                    projectMilestoneRepository.save(milestone);
                }
            }
        }

        // 6. Process Learning Items
        if (request.learningItems() != null) {
            for (LearningItemDto dto : request.learningItems()) {
                Optional<LearningItem> existing = learningItemRepository.findById(dto.id());
                if (existing.isPresent()) {
                    LearningItem item = existing.get();
                    if (dto.updatedAt().isAfter(item.getUpdatedAt())) {
                        updateLearningItemFields(item, dto);
                        learningItemRepository.save(item);
                    }
                } else {
                    LearningItem item = new LearningItem();
                    item.setId(dto.id());
                    item.setUser(user);
                    updateLearningItemFields(item, dto);
                    learningItemRepository.save(item);
                }
            }
        }

        // 7. Process Tasks
        if (request.tasks() != null) {
            for (TaskDto dto : request.tasks()) {
                Optional<Task> existing = taskRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Task task = existing.get();
                    if (dto.updatedAt().isAfter(task.getUpdatedAt())) {
                        updateTaskFields(task, dto);
                        taskRepository.save(task);
                    }
                } else {
                    Task task = new Task();
                    task.setId(dto.id());
                    task.setUser(user);
                    updateTaskFields(task, dto);
                    taskRepository.save(task);
                }
            }
            // Resolve task dependencies after all tasks are in DB
            for (TaskDto dto : request.tasks()) {
                if (dto.dependencyIds() != null) {
                    taskRepository.findById(dto.id()).ifPresent(task -> {
                        Set<Task> dependencies = dto.dependencyIds().stream()
                                .map(id -> taskRepository.findById(id).orElse(null))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());
                        task.setDependencies(dependencies);
                        taskRepository.save(task);
                    });
                }
            }
        }

        // 8. Process Notes
        if (request.notes() != null) {
            for (NoteDto dto : request.notes()) {
                Optional<Note> existing = noteRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Note note = existing.get();
                    if (dto.updatedAt().isAfter(note.getUpdatedAt())) {
                        updateNoteFields(note, dto);
                        noteRepository.save(note);
                    }
                } else {
                    Note note = new Note();
                    note.setId(dto.id());
                    note.setUser(user);
                    updateNoteFields(note, dto);
                    noteRepository.save(note);
                }
            }
        }

        // 9. Process Journals
        if (request.journals() != null) {
            for (JournalDto dto : request.journals()) {
                Optional<Journal> existing = journalRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Journal journal = existing.get();
                    if (dto.updatedAt().isAfter(journal.getUpdatedAt())) {
                        updateJournalFields(journal, dto);
                        journalRepository.save(journal);
                    }
                } else {
                    Journal journal = new Journal();
                    journal.setId(dto.id());
                    journal.setUser(user);
                    updateJournalFields(journal, dto);
                    journalRepository.save(journal);
                }
            }
        }

        // 10. Process Habits
        if (request.habits() != null) {
            for (HabitDto dto : request.habits()) {
                Optional<Habit> existing = habitRepository.findById(dto.id());
                if (existing.isPresent()) {
                    Habit habit = existing.get();
                    if (dto.updatedAt().isAfter(habit.getUpdatedAt())) {
                        updateHabitFields(habit, dto);
                        habitRepository.save(habit);
                    }
                } else {
                    Habit habit = new Habit();
                    habit.setId(dto.id());
                    habit.setUser(user);
                    updateHabitFields(habit, dto);
                    habitRepository.save(habit);
                }
            }
        }

        // 11. Process Habit Logs
        if (request.habitLogs() != null) {
            for (HabitLogDto dto : request.habitLogs()) {
                Optional<HabitLog> existing = habitLogRepository.findById(dto.id());
                if (existing.isPresent()) {
                    HabitLog log = existing.get();
                    if (dto.updatedAt().isAfter(log.getUpdatedAt())) {
                        updateHabitLogFields(log, dto);
                        habitLogRepository.save(log);
                    }
                } else {
                    HabitLog log = new HabitLog();
                    log.setId(dto.id());
                    updateHabitLogFields(log, dto);
                    habitLogRepository.save(log);
                }
            }
        }

        // Trigger automatic progress recalculations
        recalculateProgressForUser(user);

        // Fetch updates from database
        LocalDateTime queryTime = request.lastSyncTime() != null ? request.lastSyncTime() : LocalDateTime.ofEpochSecond(0, 0, ZoneOffset.UTC);

        List<GoalDto> dbGoals = goalRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapGoalToDto).collect(Collectors.toList());

        List<RoadmapDto> dbRoadmaps = roadmapRepository.findByUserOrPublicAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapRoadmapToDto).collect(Collectors.toList());

        List<RoadmapNodeDto> dbNodes = roadmapNodeRepository.findByUserOrPublicAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapRoadmapNodeToDto).collect(Collectors.toList());

        List<ProjectDto> dbProjects = projectRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapProjectToDto).collect(Collectors.toList());

        List<ProjectMilestoneDto> dbMilestones = projectMilestoneRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapProjectMilestoneToDto).collect(Collectors.toList());

        List<LearningItemDto> dbLearning = learningItemRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapLearningItemToDto).collect(Collectors.toList());

        List<TaskDto> dbTasks = taskRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapTaskToDto).collect(Collectors.toList());

        List<NoteDto> dbNotes = noteRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapNoteToDto).collect(Collectors.toList());

        List<JournalDto> dbJournals = journalRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapJournalToDto).collect(Collectors.toList());

        List<HabitDto> dbHabits = habitRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapHabitToDto).collect(Collectors.toList());

        List<HabitLogDto> dbHabitLogs = habitLogRepository.findByUserAndUpdatedAtAfter(user, queryTime).stream()
                .map(this::mapHabitLogToDto).collect(Collectors.toList());

        return new SyncResponse(
                serverSyncTime,
                dbGoals,
                dbRoadmaps,
                dbNodes,
                dbTasks,
                dbProjects,
                dbMilestones,
                dbLearning,
                dbNotes,
                dbJournals,
                dbHabits,
                dbHabitLogs
        );
    }

    private void recalculateProgressForUser(User user) {
        // Find tasks, roadmap nodes, and project milestones to recalculate progress.
        List<Goal> goals = goalRepository.findByUser(user);
        for (Goal goal : goals) {
            // Find all roadmaps linked to this goal
            List<Roadmap> roadmaps = roadmapRepository.findByUser(user).stream()
                    .filter(r -> r.getGoal() != null && r.getGoal().getId().equals(goal.getId()))
                    .collect(Collectors.toList());

            double totalRoadmapProgress = 0;
            int roadmapCount = 0;

            for (Roadmap roadmap : roadmaps) {
                List<RoadmapNode> nodes = roadmapNodeRepository.findByRoadmap(roadmap);
                if (!nodes.isEmpty()) {
                    double nodeProgressSum = 0;
                    for (RoadmapNode node : nodes) {
                        // Recalculate node progress based on its tasks
                        List<Task> nodeTasks = taskRepository.findByUser(user).stream()
                                .filter(t -> t.getRoadmapNode() != null && t.getRoadmapNode().getId().equals(node.getId()))
                                .collect(Collectors.toList());

                        if (!nodeTasks.isEmpty()) {
                            long completedTasks = nodeTasks.stream()
                                    .filter(t -> t.getStatus() == com.lifeos.backend.task.TaskStatus.DONE)
                                    .count();
                            int newProgress = (int) (((double) completedTasks / nodeTasks.size()) * 100);
                            node.setProgress(newProgress);
                            node.setStatus(newProgress == 100 ? RoadmapNodeStatus.COMPLETED :
                                           newProgress > 0 ? RoadmapNodeStatus.IN_PROGRESS : RoadmapNodeStatus.NOT_STARTED);
                            roadmapNodeRepository.save(node);
                        }
                        nodeProgressSum += node.getProgress();
                    }
                    totalRoadmapProgress += (nodeProgressSum / nodes.size());
                    roadmapCount++;
                }
            }

            // Find direct tasks linked to this goal (not associated with roadmap nodes)
            List<Task> directTasks = taskRepository.findByUser(user).stream()
                    .filter(t -> t.getGoal() != null && t.getGoal().getId().equals(goal.getId()) && t.getRoadmapNode() == null)
                    .collect(Collectors.toList());

            double tasksProgress = 0;
            if (!directTasks.isEmpty()) {
                long completed = directTasks.stream()
                        .filter(t -> t.getStatus() == com.lifeos.backend.task.TaskStatus.DONE)
                        .count();
                tasksProgress = ((double) completed / directTasks.size()) * 100;
            }

            // Find projects linked to this goal
            List<Project> projects = projectRepository.findByUser(user).stream()
                    .filter(p -> p.getGoal() != null && p.getGoal().getId().equals(goal.getId()))
                    .collect(Collectors.toList());

            double projectsProgress = 0;
            int projectCount = 0;
            for (Project project : projects) {
                List<ProjectMilestone> milestones = projectMilestoneRepository.findByProject(project);
                if (!milestones.isEmpty()) {
                    long completedMilestones = milestones.stream().filter(ProjectMilestone::isCompleted).count();
                    projectsProgress += (((double) completedMilestones / milestones.size()) * 100);
                    projectCount++;
                }
            }
            if (projectCount > 0) {
                projectsProgress = projectsProgress / projectCount;
            }

            // Calculate overall goal progress
            double compositeProgress = 0;
            int denominators = 0;

            if (roadmapCount > 0) {
                compositeProgress += (totalRoadmapProgress / roadmapCount);
                denominators++;
            }
            if (!directTasks.isEmpty()) {
                compositeProgress += tasksProgress;
                denominators++;
            }
            if (projectCount > 0) {
                compositeProgress += projectsProgress;
                denominators++;
            }

            if (denominators > 0) {
                goal.setProgressPercentage((int) (compositeProgress / denominators));
                goal.setStatus(goal.getProgressPercentage() == 100 ? GoalStatus.COMPLETED : GoalStatus.IN_PROGRESS);
                goalRepository.save(goal);
            }
        }

        // Update habit streaks dynamically
        List<Habit> habits = habitRepository.findByUser(user);
        for (Habit habit : habits) {
            List<HabitLog> logs = habitLogRepository.findByHabit(habit).stream()
                    .filter(HabitLog::isCompleted)
                    .sorted(Comparator.comparing(HabitLog::getCompletedDate).reversed())
                    .collect(Collectors.toList());

            int streak = 0;
            if (!logs.isEmpty()) {
                java.time.LocalDate today = java.time.LocalDate.now();
                java.time.LocalDate expected = today;

                // If not completed today, check if completed yesterday to keep streak
                if (!logs.get(0).getCompletedDate().equals(today)) {
                    expected = today.minusDays(1);
                }

                for (HabitLog log : logs) {
                    if (log.getCompletedDate().equals(expected)) {
                        streak++;
                        expected = expected.minusDays(1);
                    } else if (log.getCompletedDate().isBefore(expected)) {
                        break;
                    }
                }
            }
            if (habit.getStreak() != streak) {
                habit.setStreak(streak);
                habitRepository.save(habit);
            }
        }
    }

    // --- Helper updates ---

    private void updateGoalFields(Goal goal, GoalDto dto) {
        goal.setTitle(dto.title());
        goal.setDescription(dto.description());
        goal.setPriority(dto.priority());
        goal.setStatus(dto.status());
        goal.setProgressPercentage(dto.progressPercentage());
        goal.setTargetDate(dto.targetDate());
        goal.setLifeArea(dto.lifeArea());
        goal.setMotivation(dto.motivation());
    }

    private void updateRoadmapFields(Roadmap roadmap, RoadmapDto dto) {
        roadmap.setTitle(dto.title());
        roadmap.setDescription(dto.description());
        roadmap.setTemplate(dto.isTemplate());
        roadmap.setPublic(dto.isPublic());
        if (dto.goalId() != null) {
            roadmap.setGoal(goalRepository.findById(dto.goalId()).orElse(null));
        } else {
            roadmap.setGoal(null);
        }
    }

    private void updateRoadmapNodeFields(RoadmapNode node, RoadmapNodeDto dto) {
        node.setTitle(dto.title());
        node.setDescription(dto.description());
        node.setResources(dto.resources());
        node.setStatus(dto.status());
        node.setOrderIndex(dto.orderIndex());
        node.setDeadline(dto.deadline());
        node.setProgress(dto.progress());
        node.setRoadmap(roadmapRepository.findById(dto.roadmapId()).orElse(null));
        if (dto.parentNodeId() != null) {
            node.setParentNode(roadmapNodeRepository.findById(dto.parentNodeId()).orElse(null));
        } else {
            node.setParentNode(null);
        }
    }

    private void updateProjectFields(Project project, ProjectDto dto) {
        project.setTitle(dto.title());
        project.setDescription(dto.description());
        project.setStatus(dto.status());
        project.setDeadline(dto.deadline());
        if (dto.goalId() != null) {
            project.setGoal(goalRepository.findById(dto.goalId()).orElse(null));
        } else {
            project.setGoal(null);
        }
    }

    private void updateProjectMilestoneFields(ProjectMilestone milestone, ProjectMilestoneDto dto) {
        milestone.setTitle(dto.title());
        milestone.setDescription(dto.description());
        milestone.setCompleted(dto.isCompleted());
        milestone.setDueDate(dto.dueDate());
        milestone.setProject(projectRepository.findById(dto.projectId()).orElse(null));
    }

    private void updateLearningItemFields(LearningItem item, LearningItemDto dto) {
        item.setTitle(dto.title());
        item.setDescription(dto.description());
        item.setType(dto.type());
        item.setStatus(dto.status());
        item.setProgressPercentage(dto.progressPercentage());
        item.setTotalLessonsPages(dto.totalLessonsPages());
        item.setCompletedLessonsPages(dto.completedLessonsPages());
        if (dto.goalId() != null) {
            item.setGoal(goalRepository.findById(dto.goalId()).orElse(null));
        } else {
            item.setGoal(null);
        }
        if (dto.roadmapNodeId() != null) {
            item.setRoadmapNode(roadmapNodeRepository.findById(dto.roadmapNodeId()).orElse(null));
        } else {
            item.setRoadmapNode(null);
        }
    }

    private void updateTaskFields(Task task, TaskDto dto) {
        task.setTitle(dto.title());
        task.setDescription(dto.description());
        task.setDueDate(dto.dueDate());
        task.setPriority(dto.priority());
        task.setStatus(dto.status());
        task.setRecurring(dto.isRecurring());
        task.setRecurrencePattern(dto.recurrencePattern());
        task.setEstimatedTime(dto.estimatedTime());
        task.setActualTime(dto.actualTime());
        task.setLifeArea(dto.lifeArea());
        if (dto.goalId() != null) {
            task.setGoal(goalRepository.findById(dto.goalId()).orElse(null));
        } else {
            task.setGoal(null);
        }
        if (dto.projectId() != null) {
            task.setProject(projectRepository.findById(dto.projectId()).orElse(null));
        } else {
            task.setProject(null);
        }
        if (dto.roadmapNodeId() != null) {
            task.setRoadmapNode(roadmapNodeRepository.findById(dto.roadmapNodeId()).orElse(null));
        } else {
            task.setRoadmapNode(null);
        }
        if (dto.parentTaskId() != null) {
            task.setParentTask(taskRepository.findById(dto.parentTaskId()).orElse(null));
        } else {
            task.setParentTask(null);
        }
    }

    private void updateNoteFields(Note note, NoteDto dto) {
        note.setTitle(dto.title());
        note.setContent(dto.content());
        note.setCategory(dto.category());
        if (dto.goalId() != null) {
            note.setGoal(goalRepository.findById(dto.goalId()).orElse(null));
        } else {
            note.setGoal(null);
        }
        if (dto.taskId() != null) {
            note.setTask(taskRepository.findById(dto.taskId()).orElse(null));
        } else {
            note.setTask(null);
        }
        if (dto.projectId() != null) {
            note.setProject(projectRepository.findById(dto.projectId()).orElse(null));
        } else {
            note.setProject(null);
        }
        if (dto.roadmapNodeId() != null) {
            note.setRoadmapNode(roadmapNodeRepository.findById(dto.roadmapNodeId()).orElse(null));
        } else {
            note.setRoadmapNode(null);
        }
        if (dto.learningItemId() != null) {
            note.setLearningItem(learningItemRepository.findById(dto.learningItemId()).orElse(null));
        } else {
            note.setLearningItem(null);
        }
    }

    private void updateJournalFields(Journal journal, JournalDto dto) {
        journal.setEntryDate(dto.entryDate());
        journal.setWins(dto.wins());
        journal.setChallenges(dto.challenges());
        journal.setLessonsLearned(dto.lessonsLearned());
        journal.setGratitude(dto.gratitude());
        journal.setMood(dto.mood());
        journal.setEnergyLevel(dto.energyLevel());
    }

    private void updateHabitFields(Habit habit, HabitDto dto) {
        habit.setTitle(dto.title());
        habit.setDescription(dto.description());
        habit.setFrequency(dto.frequency());
        habit.setStreak(dto.streak());
    }

    private void updateHabitLogFields(HabitLog log, HabitLogDto dto) {
        log.setCompletedDate(dto.completedDate());
        log.setCompleted(dto.isCompleted());
        log.setHabit(habitRepository.findById(dto.habitId()).orElse(null));
    }

    // --- Helper Mappings ---

    private GoalDto mapGoalToDto(Goal goal) {
        return new GoalDto(goal.getId(), goal.getTitle(), goal.getDescription(), goal.getPriority(), goal.getStatus(),
                goal.getProgressPercentage(), goal.getTargetDate(), goal.getLifeArea(), goal.getMotivation(),
                goal.getCreatedAt(), goal.getUpdatedAt());
    }

    private RoadmapDto mapRoadmapToDto(Roadmap roadmap) {
        return new RoadmapDto(roadmap.getId(), roadmap.getGoal() != null ? roadmap.getGoal().getId() : null,
                roadmap.getTitle(), roadmap.getDescription(), roadmap.isTemplate(), roadmap.isPublic(),
                roadmap.getCreatedAt(), roadmap.getUpdatedAt());
    }

    private RoadmapNodeDto mapRoadmapNodeToDto(RoadmapNode node) {
        return new RoadmapNodeDto(node.getId(), node.getRoadmap().getId(),
                node.getParentNode() != null ? node.getParentNode().getId() : null, node.getTitle(), node.getDescription(),
                node.getResources(), node.getStatus(), node.getOrderIndex(), node.getDeadline(), node.getProgress(),
                node.getCreatedAt(), node.getUpdatedAt());
    }

    private ProjectDto mapProjectToDto(Project project) {
        return new ProjectDto(project.getId(), project.getGoal() != null ? project.getGoal().getId() : null,
                project.getTitle(), project.getDescription(), project.getStatus(), project.getDeadline(),
                project.getCreatedAt(), project.getUpdatedAt());
    }

    private ProjectMilestoneDto mapProjectMilestoneToDto(ProjectMilestone milestone) {
        return new ProjectMilestoneDto(milestone.getId(), milestone.getProject().getId(), milestone.getTitle(),
                milestone.getDescription(), milestone.isCompleted(), milestone.getDueDate(),
                milestone.getCreatedAt(), milestone.getUpdatedAt());
    }

    private LearningItemDto mapLearningItemToDto(LearningItem item) {
        return new LearningItemDto(item.getId(), item.getGoal() != null ? item.getGoal().getId() : null,
                item.getRoadmapNode() != null ? item.getRoadmapNode().getId() : null, item.getTitle(), item.getDescription(),
                item.getType(), item.getStatus(), item.getProgressPercentage(), item.getTotalLessonsPages(),
                item.getCompletedLessonsPages(), item.getCreatedAt(), item.getUpdatedAt());
    }

    private TaskDto mapTaskToDto(Task task) {
        Set<UUID> dependencyIds = task.getDependencies().stream().map(Task::getId).collect(Collectors.toSet());
        return new TaskDto(task.getId(), task.getGoal() != null ? task.getGoal().getId() : null,
                task.getProject() != null ? task.getProject().getId() : null,
                task.getRoadmapNode() != null ? task.getRoadmapNode().getId() : null, task.getTitle(), task.getDescription(),
                task.getDueDate(), task.getPriority(), task.getStatus(), task.isRecurring(), task.getRecurrencePattern(),
                task.getParentTask() != null ? task.getParentTask().getId() : null, task.getEstimatedTime(),
                task.getActualTime(), task.getLifeArea(), dependencyIds, task.getCreatedAt(), task.getUpdatedAt());
    }

    private NoteDto mapNoteToDto(Note note) {
        return new NoteDto(note.getId(), note.getGoal() != null ? note.getGoal().getId() : null,
                note.getTask() != null ? note.getTask().getId() : null,
                note.getProject() != null ? note.getProject().getId() : null,
                note.getRoadmapNode() != null ? note.getRoadmapNode().getId() : null,
                note.getLearningItem() != null ? note.getLearningItem().getId() : null, note.getTitle(), note.getContent(),
                note.getCategory(), note.getCreatedAt(), note.getUpdatedAt());
    }

    private JournalDto mapJournalToDto(Journal journal) {
        return new JournalDto(journal.getId(), journal.getEntryDate(), journal.getWins(), journal.getChallenges(),
                journal.getLessonsLearned(), journal.getGratitude(), journal.getMood(), journal.getEnergyLevel(),
                journal.getCreatedAt(), journal.getUpdatedAt());
    }

    private HabitDto mapHabitToDto(Habit habit) {
        return new HabitDto(habit.getId(), habit.getTitle(), habit.getDescription(), habit.getFrequency(),
                habit.getStreak(), habit.getCreatedAt(), habit.getUpdatedAt());
    }

    private HabitLogDto mapHabitLogToDto(HabitLog log) {
        return new HabitLogDto(log.getId(), log.getHabit().getId(), log.getCompletedDate(), log.isCompleted(),
                log.getCreatedAt(), log.getUpdatedAt());
    }
}
