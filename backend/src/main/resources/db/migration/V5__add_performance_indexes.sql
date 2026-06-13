-- Index foreign keys to optimize query, join, and synchronization performance
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_goal ON roadmaps(goal_id);
CREATE INDEX idx_roadmap_nodes_roadmap ON roadmap_nodes(roadmap_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_goal ON projects(goal_id);
CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_learning_items_user ON learning_items(user_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_goal ON tasks(goal_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_goal ON notes(goal_id);
CREATE INDEX idx_journals_user ON journals(user_id);
CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
