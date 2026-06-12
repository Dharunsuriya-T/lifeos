package com.lifeos.backend.roadmap;

import com.lifeos.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "roadmap_nodes")
@Getter
@Setter
@NoArgsConstructor
public class RoadmapNode extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_id", nullable = false)
    private Roadmap roadmap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_node_id")
    private RoadmapNode parentNode;

    @Column(nullable = false)
    private String title;

    private String description;

    private String resources;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoadmapNodeStatus status;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    private LocalDateTime deadline;

    @Column(nullable = false)
    private int progress;
}
