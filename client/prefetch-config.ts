(function initPrefetchConfig(global) {
  const PAGE_KEYS = {
    dashboard: [
      'pa_projects', 'pa_technologies', 'pa_experience', 'pa_testimonials',
      'pa_media_library', 'pa_tools', 'pa_category_meta', 'pa_recent_activities',
    ],
    projects: ['pa_projects', 'pa_category_meta', 'pa_technologies', 'pa_tool_categories'],
    categories: ['pa_category_meta'],
    technologies: ['pa_technologies'],
    'tool-categories': ['pa_tool_categories'],
    tools: ['pa_tools', 'pa_tool_categories'],
    media: ['pa_media_library'],
    testimonials: ['pa_testimonials'],
    blogposts: ['pa_blog_posts', 'pa_blog_categories'],
    'blog-tags': ['pa_blog_tags', 'pa_blog_posts'],
    'project-tags': ['pa_project_tag_labels', 'pa_projects'],
    'blog-engagement': ['pa_blog_posts'],
    experience: ['pa_experience'],
    'contact-messages': ['pa_contact_messages'],
    'recent-activities': ['pa_recent_activities'],
    settings: ['pa_settings', 'pa_recent_activities', 'pa_notification_preferences'],
  };

  const ROUTE_BY_KEY = {
    pa_projects: '/api/projects',
    pa_category_meta: '/api/categories',
    pa_technologies: '/api/technologies',
    pa_media_library: '/api/media',
    pa_testimonials: '/api/testimonials',
    pa_blog_posts: '/api/blog-posts?full=1',
    pa_blog_categories: '/api/blog-categories',
    pa_project_tag_labels: '/api/project-tags',
    pa_project_technology_usage: '/api/project-technologies',
    pa_blog_tags: '/api/blog-tags',
    pa_project_tags: '/api/project-tags',
    pa_experience: '/api/experience',
    pa_contact_messages: '/api/contact-messages',
    pa_recent_activities: '/api/recent-activities',
    pa_tools: '/api/tools',
    pa_tool_categories: '/api/tool-categories',
    pa_settings: '/api/settings',
    pa_msg_column_visibility: '/api/preferences/contact-columns',
    pa_notification_preferences: '/api/notification-preferences',
    pa_notifications: '/api/notifications',
  };

  function resolvePage(path) {
    if (path.includes('/project-tags')) return 'project-tags';
    if (path.includes('/project-technologies')) return 'project-technologies';
    if (path.includes('/project-categories')) return 'categories';
    if (path.includes('/blog-categories')) return 'blog-categories';
    if (path.includes('/tool-categories')) return 'tool-categories';
    if (path.includes('/blog-tags')) return 'blog-tags';
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/technologies')) return 'technologies';
    if (path.includes('/tools')) return 'tools';
    if (path.includes('/media-library')) return 'media';
    if (path.includes('/testimonials')) return 'testimonials';
    if (path.includes('/blog-engagement')) return 'blog-engagement';
    if (path.includes('/blog-post')) return 'blogposts';
    if (path.includes('/experience')) return 'experience';
    if (path.includes('/contact-messages')) return 'contact-messages';
    if (path.includes('/recent-activities')) return 'recent-activities';
    if (path.includes('/settings')) return 'settings';
    return 'dashboard';
  }

  global.__paPrefetchConfig = {
    PAGE_KEYS,
    ROUTE_BY_KEY,
    resolvePage,
  };
})(typeof window !== 'undefined' ? window : globalThis);
