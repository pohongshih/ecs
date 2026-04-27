# Firebase Security Specification

## Data Invariants
1. Students can only create submissions for homework in classes they are enrolled in.
2. Only teachers can create classes and homework assignments.
3. Teachers can only grade submissions for homework they assigned (or in their classes).
4. Submissions are immutable once graded by a teacher (except for teacher comments/scores).
5. User profile role is immutable after creation (unless by admin - we'll keep it simple: role set on first login).

## The Dirty Dozen (Vulnerability Test Payloads)

1. **Role Escalation**: Student tries to update their own profile to `role: "teacher"`.
2. **Invisible Enrollment**: Student tries to join a class they aren't invited to by modifying `classIds`.
3. **Cross-Homework Submission**: Student submits homework for a class they aren't in.
4. **Identity Theft**: Student submits homework with another student's `studentId`.
5. **Score Injection**: Student submits homework with an already filled `score: 100`.
6. **Teacher Impersonation**: Student tries to create a `Class`.
7. **Homework Sabotage**: Student tries to delete a `Homework` object.
8. **Feedback Tampering**: Student tries to update their own `teacherComment` or `score`.
9. **Class Hijacking**: Teacher A tries to edit Teacher B's class.
10. **ID Poisoning**: Creating a submission with a 1MB string as ID.
11. **Shadow Fields**: Creating a User with extra hidden fields like `isAdmin: true`.
12. **Future Submission**: Submitting homework with a `createdAt` in the future (not `request.time`).

## Rule Architecture

- `isSignedIn()` check.
- `isValidId(id)` check.
- `isValidUser(data)`, `isValidClass(data)`, `isValidHomework(data)`, `isValidSubmission(data)` validation helpers.
- `isTeacher()` helper (checks role in `users` collection).
- Match blocks with explicit `allow list` and `allow get`.
