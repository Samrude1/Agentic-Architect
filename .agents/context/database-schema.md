# Database Schema

This document represents the current ground truth of the database schema for the project.

## Tables

### `Project`
- Description: Represents a software project being built by the AI.
- Relations: None yet

#### Columns
| Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key, UUID | Unique identifier |
| `createdAt` | DateTime | Default `now()` | Creation timestamp |
| `name` | String | Not Null | Project name |
| `status` | String | Default `PLANNING` | Current phase |
| `prompt` | String | Nullable | Initial business requirements |

---
*(Note: Using SQLite for development)*
