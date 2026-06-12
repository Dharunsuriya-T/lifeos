package com.lifeos.backend.learning;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.roadmap.RoadmapNode;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "learning_items")
@Getter
@Setter
@NoArgsConstructor
public class LearningItem extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_node_id")
    private RoadmapNode roadmapNode;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LearningType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LearningStatus status;

    @Column(name = "progress_percentage", nullable = false)
    private int progressPercentage;

    @Column(name = "total_lessons_pages")
    private Integer totalLessonsPages;

    @Column(name = "completed_lessons_pages")
    private Integer completedLessonsPages;
}
