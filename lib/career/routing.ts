const CAREER_ACTION =
  /\b(job|jobs|career|careers|cv|cvs|resume|resumes|résumé|interview|interviews|hiring|vacancy|vacancies|apply|applying|job application|job applications|recruiter|recruiters|employment|remote roles?|engineering roles?)\b/i

export function isCareerWorkspaceGoal(text: string) {
  const value = text.trim()
  return value.length > 0 && CAREER_ACTION.test(value)
}
