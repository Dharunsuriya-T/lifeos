package com.lifeos.backend.note;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.learning.LearningItem;
import com.lifeos.backend.project.Project;
import com.lifeos.backend.roadmap.RoadmapNode;
import com.lifeos.backend.task.Task;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "notes")
@Getter
@Setter
@NoArgsConstructor
public class Note extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_node_id")
    private RoadmapNode roadmapNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_item_id")
    private LearningItem learningItem;

    @Column(nullable = false)
    private String title;

    private String content;

    private String category;
}
