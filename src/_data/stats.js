const calculateStreak = function(posts) {
  if (!posts || posts.length === 0) return 0;
  
  const sortedPosts = posts
    .map(post => new Date(post.date))
    .sort((a, b) => b - a);
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(23, 59, 59, 999); // End of today
  
  for (const postDate of sortedPosts) {
    const daysDiff = Math.floor((currentDate - postDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) { // Within a week
      streak++;
      currentDate = new Date(postDate);
      currentDate.setHours(23, 59, 59, 999);
    } else {
      break;
    }
  }
  
  return streak;
};

export default {
  posts: function(data) {
    const posts = data.collections.posts || [];
    return {
      total: posts.length,
      published: posts.filter(post => !post.data.draft).length,
      drafts: posts.filter(post => post.data.draft).length,
      thisYear: posts.filter(post => new Date(post.date).getFullYear() === new Date().getFullYear()).length,
      thisMonth: posts.filter(post => {
        const now = new Date();
        const postDate = new Date(post.date);
        return postDate.getFullYear() === now.getFullYear() && 
               postDate.getMonth() === now.getMonth();
      }).length
    };
  },
  
  snippets: function(data) {
    const snippets = data.collections.snippets || [];
    return {
      total: snippets.length,
      published: snippets.filter(snippet => !snippet.data.draft).length,
      languages: [...new Set(snippets.map(s => s.data.language).filter(Boolean))].length
    };
  },
  
  tags: function(data) {
    const tagList = data.collections.tagList || [];
    const snippetTags = data.collections.snippetTags || [];
    return {
      total: tagList.length,
      snippetTags: snippetTags.length,
      combined: [...new Set([...tagList, ...snippetTags])].length
    };
  },
  
  words: function(data) {
    const posts = data.collections.posts || [];
    const snippets = data.collections.snippets || [];
    
    const countWords = (content) => {
      if (!content) return 0;
      // Remove HTML tags and count words
      const text = content.replace(/<[^>]*>/g, '');
      return text.split(/\s+/).filter(word => word.length > 0).length;
    };
    
    const postWords = posts.reduce((total, post) => {
      return total + countWords(post.templateContent || post.content);
    }, 0);
    
    const snippetWords = snippets.reduce((total, snippet) => {
      return total + countWords(snippet.templateContent || snippet.content);
    }, 0);
    
    return {
      posts: postWords,
      snippets: snippetWords,
      total: postWords + snippetWords,
      average: posts.length > 0 ? Math.round(postWords / posts.length) : 0
    };
  },
  
  site: function(data) {
    const allPages = data.collections.all || [];
    const posts = data.collections.posts || [];
    
    // Calculate site age
    const oldestPost = posts.length > 0 ? 
      posts.reduce((oldest, post) => 
        new Date(post.date) < new Date(oldest.date) ? post : oldest
      ) : null;
    
    const siteAge = oldestPost ? 
      Math.floor((new Date() - new Date(oldestPost.date)) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      totalPages: allPages.length,
      siteAgeDays: siteAge,
      siteAgeYears: Math.floor(siteAge / 365),
      lastUpdated: new Date().toISOString(),
      buildDate: new Date().toISOString()
    };
  },
  
  activity: function(data) {
    const posts = data.collections.posts || [];
    const now = new Date();
    
    // Posts by month for the last 12 months
    const monthlyActivity = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthPosts = posts.filter(post => {
        const postDate = new Date(post.date);
        return postDate.getFullYear() === date.getFullYear() && 
               postDate.getMonth() === date.getMonth();
      }).length;
      
      monthlyActivity.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        posts: monthPosts
      });
    }
    
    return {
      monthly: monthlyActivity,
      streak: calculateStreak(posts),
      mostActiveMonth: monthlyActivity.reduce((max, current) => 
        current.posts > max.posts ? current : max, { posts: 0 }
      )
    };
  }
};
