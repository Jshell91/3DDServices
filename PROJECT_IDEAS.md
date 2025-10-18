# Project Improvement Ideas

1. Web admin panel for stats, likes, users, and logs.
2. Notifications/webhooks for events (email, Discord, Slack).
3. User authentication system (OAuth, JWT).
4. Activity history and analytics (graphs, daily likes, active users).
5. Automated tests and CI/CD integration.
6. Interactive API documentation (Swagger/OpenAPI).
7. Internationalization (multi-language support).
8. Monitoring and alerts (Prometheus, Grafana, cloud services).
9. Advanced security audit and access control.
10. Containerized deployment (Docker, Kubernetes, cloud).

11. Build output housekeeping (ideas, not yet implemented):
	- Add `-Clean` switch to remove previous outputs (WindowsClient/WindowsServer/LinuxServer) before a new build.
	- Add `-PurgeOlderThan <days>` or `-KeepLast <N>` to automatically prune old builds and save disk space.
	- Optional archive rotation strategy with size cap for `ArchiveDir`.
