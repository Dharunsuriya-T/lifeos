package com.lifeos.backend.task;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.project.Project;
import com.lifeos.backend.roadmap.RoadmapNode;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
public class Task extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_node_id")
    private RoadmapNode roadmapNode;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @Column(name = "is_recurring", nullable = false)
    private boolean isRecurring;

    @Column(name = "recurrence_pattern")
    private String recurrencePattern;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id")
    private Task parentTask;

    @Column(name = "estimated_time", nullable = false)
    private int estimatedTime;

    @Column(name = "actual_time", nullable = false)
    private int actualTime;

    @Column(name = "life_area")
    private String lifeArea;

    @ManyToMany
    @JoinTable(
        name = "task_dependencies",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "dependency_task_id")
    )
    private Set<Task> dependencies = new HashSet<>();
}
