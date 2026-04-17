import { createSelector } from 'reselect'
import type { BlogPost } from '../../shared/blog/types/blog.domain'
import type { RootState } from '../../shells/store'
import { blogReducer, postsSelectors } from './blog.slice'

type BlogState = ReturnType<typeof blogReducer>

// Base selector to get the blog state
const selectBlogState = (state: RootState): BlogState => state.blog

// Select all posts from normalized state
const selectAllPosts = createSelector([selectBlogState], (blogState): BlogPost[] => postsSelectors.selectAll(blogState))

// Select posts as a dictionary (id -> post)
const selectPostsEntities = createSelector(
  [selectBlogState],
  (blogState): Record<string, BlogPost> => postsSelectors.selectEntities(blogState)
)

// Select a post by ID from normalized state
const selectPostById = createSelector(
  [selectBlogState, (_state: RootState, postId: string) => postId],
  (blogState, postId): BlogPost | undefined => postsSelectors.selectById(blogState, postId)
)

// Select total count of cached posts
const selectPostsTotal = createSelector([selectBlogState], (blogState): number => postsSelectors.selectTotal(blogState))

export { selectAllPosts, selectPostById, selectPostsEntities, selectPostsTotal }
