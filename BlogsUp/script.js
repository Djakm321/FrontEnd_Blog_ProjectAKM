// Blog Application
class BlogApp {
    constructor() {
        this.posts = [];
        this.currentSort = 'newest';
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        this.init();
    }
    
    init() {
        this.loadPosts();
        this.setupEventListeners();
        this.applyDarkMode();
        this.renderPosts();
        this.renderTags();
    }
    
    // Load posts from localStorage or initial JSON
    loadPosts() {
        const storedPosts = localStorage.getItem('blogPosts');
        if (storedPosts) {
            this.posts = JSON.parse(storedPosts);
        } else {
            // Load initial posts from JSON file
            fetch('initial_posts.json')
                .then(response => response.json())
                .then(posts => {
                    this.posts = posts;
                    this.savePosts();
                    this.renderPosts();
                    this.renderTags();
                })
                .catch(error => {
                    console.error('Error loading initial posts:', error);
                    this.posts = [];
                });
        }
    }
    
    // Save posts to localStorage
    savePosts() {
        localStorage.setItem('blogPosts', JSON.stringify(this.posts));
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Sort and filter
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.sort-option').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSort = e.target.dataset.sort;
                this.renderPosts();
            });
        });
        
        // Search
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchQuery = document.getElementById('search-input').value;
            this.renderPosts();
        });
        
        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.searchQuery = e.target.value;
                this.renderPosts();
            }
        });
        
        // Create/edit post form
        document.getElementById('save-post').addEventListener('click', () => {
            this.savePost();
        });
        
        // Close overlay
        document.getElementById('close-overlay').addEventListener('click', () => {
            this.hidePostDetail();
        });
        
        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // Export posts
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportPosts();
        });
        
        // Import posts
        document.getElementById('import-btn').addEventListener('click', () => {
            this.showImportModal();
        });
        
        document.getElementById('confirm-import').addEventListener('click', () => {
            this.importPosts();
        });
        
        // Home link
        document.getElementById('home-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.searchQuery = '';
            document.getElementById('search-input').value = '';
            this.currentFilter = 'all';
            document.querySelectorAll('#tag-filter .dropdown-item').forEach(el => {
                el.classList.remove('active');
                if (el.dataset.tag === 'all') el.classList.add('active');
            });
            this.renderPosts();
        });
    }
    
    // Apply dark mode
    applyDarkMode() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    // Toggle dark mode
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyDarkMode();
    }
    
    // Render posts based on current filters and sort
    renderPosts() {
        const container = document.getElementById('posts-container');
        
        // Filter and sort posts
        let filteredPosts = this.filterPosts();
        filteredPosts = this.sortPosts(filteredPosts);
        
        if (filteredPosts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#createPostModal">
                        Create Your First Post
                    </button>
                </div>
            `;
            return;
        }
        
        // Render posts
        container.innerHTML = filteredPosts.map(post => `
            <div class="post-card">
                <div class="row">
                    ${post.image ? `
                    <div class="col-md-4">
                        <img src="${post.image}" class="post-image w-100" alt="${post.title}">
                    </div>
                    <div class="col-md-8">
                    ` : '<div class="col-12">'}
                        <a href="#" class="post-title" data-id="${post.id}">${post.title}</a>
                        <div class="post-content-preview">${this.truncateText(this.stripMarkdown(post.content), 150)}</div>
                        <div class="post-meta">
                            <span>By ${post.author}</span> • 
                            <span>${this.formatDate(post.date)}</span> • 
                            <span>${post.likes} likes</span>
                        </div>
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="action-buttons">
                            <button class="btn-like ${this.isPostLiked(post.id) ? 'liked' : ''}" data-id="${post.id}">
                                <i class="fas fa-heart"></i> <span>${post.likes}</span>
                            </button>
                            <button class="btn-comment" data-id="${post.id}">
                                <i class="fas fa-comment"></i> <span>${post.comments.length}</span>
                            </button>
                            <button class="btn-edit" data-id="${post.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" data-id="${post.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to post elements
        this.attachPostEventListeners();
    }
    
    // Filter posts based on search and tag filter
    filterPosts() {
        let filtered = this.posts;
        
        // Apply tag filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(post => 
                post.tags.includes(this.currentFilter)
            );
        }
        
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(post => 
                post.title.toLowerCase().includes(query) || 
                post.content.toLowerCase().includes(query) ||
                post.author.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }
    
    // Sort posts based on current sort option
    sortPosts(posts) {
        switch (this.currentSort) {
            case 'newest':
                return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'oldest':
                return [...posts].sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'likes':
                return [...posts].sort((a, b) => b.likes - a.likes);
            default:
                return posts;
        }
    }
    
    // Render tags in sidebar and filter dropdown
    renderTags() {
        const tagsContainer = document.getElementById('popular-tags');
        const filterContainer = document.getElementById('tag-filter');
        
        // Get all tags and count occurrences
        const tagCounts = {};
        this.posts.forEach(post => {
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        
        // Sort tags by count
        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        // Render popular tags
        tagsContainer.innerHTML = sortedTags.map(([tag, count]) => `
            <a href="#" class="tag me-2 mb-2" data-tag="${tag}">${tag} (${count})</a>
        `).join('');
        
        // Render filter dropdown (excluding "all" which is already there)
        const existingTags = Array.from(filterContainer.querySelectorAll('.dropdown-item'))
            .map(el => el.dataset.tag);
        
        sortedTags.forEach(([tag]) => {
            if (!existingTags.includes(tag)) {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item" href="#" data-tag="${tag}">${tag}</a>`;
                filterContainer.appendChild(li);
            }
        });
        
        // Add event listeners to tag filters
        document.querySelectorAll('#tag-filter .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('#tag-filter .dropdown-item').forEach(el => {
                    el.classList.remove('active');
                });
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.tag;
                this.renderPosts();
            });
        });
        
        // Add event listeners to popular tags
        document.querySelectorAll('#popular-tags .tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedTag = e.target.dataset.tag;
                
                // Update filter dropdown
                document.querySelectorAll('#tag-filter .dropdown-item').forEach(el => {
                    el.classList.remove('active');
                    if (el.dataset.tag === selectedTag) el.classList.add('active');
                });
                
                this.currentFilter = selectedTag;
                this.renderPosts();
            });
        });
    }
    
    // Attach event listeners to post elements
    attachPostEventListeners() {
        // Post title click - show post detail
        document.querySelectorAll('.post-title').forEach(title => {
            title.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = parseInt(e.target.dataset.id);
                this.showPostDetail(postId);
            });
        });
        
        // Like button
        document.querySelectorAll('.btn-like').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.currentTarget.dataset.id);
                this.toggleLike(postId);
            });
        });
        
        // Comment button
        document.querySelectorAll('.btn-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.currentTarget.dataset.id);
                this.showPostDetail(postId, true);
            });
        });
        
        // Edit button
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.currentTarget.dataset.id);
                this.editPost(postId);
            });
        });
        
        // Delete button
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.currentTarget.dataset.id);
                this.deletePost(postId);
            });
        });
    }
    
    // Show post detail in overlay
    showPostDetail(postId, focusComment = false) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        const detailContainer = document.getElementById('post-detail');
        detailContainer.innerHTML = `
            ${post.image ? `<img src="${post.image}" class="post-detail-image" alt="${post.title}">` : ''}
            <h1 class="post-detail-title">${post.title}</h1>
            <div class="post-detail-meta">
                <span>By ${post.author}</span> • 
                <span>${this.formatDate(post.date)}</span> • 
                <span>${post.likes} likes</span>
                <div class="post-tags mt-2">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="post-detail-content">${marked.parse(post.content)}</div>
            <div class="action-buttons mb-4">
                <button class="btn-like ${this.isPostLiked(post.id) ? 'liked' : ''}" data-id="${post.id}">
                    <i class="fas fa-heart"></i> <span>${post.likes}</span>
                </button>
                <button class="btn-edit" data-id="${post.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" data-id="${post.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div class="comments-section">
                <h4>Comments (${post.comments.length})</h4>
                <div id="comments-list">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <div class="comment-author">${comment.author}</div>
                            <div class="comment-date">${this.formatDate(comment.date)}</div>
                            <div class="comment-content">${comment.content}</div>
                        </div>
                    `).join('')}
                </div>
                <form class="comment-form">
                    <div class="mb-3">
                        <label for="comment-author" class="form-label">Your Name</label>
                        <input type="text" class="form-control" id="comment-author" required>
                    </div>
                    <div class="mb-3">
                        <label for="comment-content" class="form-label">Your Comment</label>
                        <textarea class="form-control" id="comment-content" rows="3" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Comment</button>
                </form>
            </div>
        `;
        
        // Add event listeners in overlay
        detailContainer.querySelector('.btn-like').addEventListener('click', () => {
            this.toggleLike(postId);
            this.showPostDetail(postId, focusComment);
        });
        
        detailContainer.querySelector('.btn-edit').addEventListener('click', () => {
            this.editPost(postId);
        });
        
        detailContainer.querySelector('.btn-delete').addEventListener('click', () => {
            this.deletePost(postId);
        });
        
        // Comment form submission
        detailContainer.querySelector('.comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addComment(postId);
        });
        
        // Show overlay
        document.getElementById('post-overlay').style.display = 'block';
        
        // Focus comment form if requested
        if (focusComment) {
            setTimeout(() => {
                document.getElementById('comment-content').focus();
            }, 300);
        }
    }
    
    // Hide post detail overlay
    hidePostDetail() {
        document.getElementById('post-overlay').style.display = 'none';
    }
    
    // Toggle like for a post
    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        const isLiked = likedPosts.includes(postId);
        
        if (isLiked) {
            // Unlike
            post.likes--;
            localStorage.setItem('likedPosts', JSON.stringify(likedPosts.filter(id => id !== postId)));
        } else {
            // Like
            post.likes++;
            likedPosts.push(postId);
            localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        }
        
        this.savePosts();
        this.renderPosts();
    }
    
    // Check if post is liked by current user
    isPostLiked(postId) {
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        return likedPosts.includes(postId);
    }
    
    // Add comment to a post
    addComment(postId) {
        const authorInput = document.getElementById('comment-author');
        const contentInput = document.getElementById('comment-content');
        
        const author = authorInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!author || !content) return;
        
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        const newComment = {
            id: Date.now(),
            author,
            content,
            date: new Date().toISOString().split('T')[0]
        };
        
        post.comments.push(newComment);
        this.savePosts();
        
        // Clear form
        authorInput.value = '';
        contentInput.value = '';
        
        // Refresh post detail
        this.showPostDetail(postId, true);
    }
    
    // Edit post
    editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        // Fill form with post data
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-author').value = post.author;
        document.getElementById('post-image').value = post.image || '';
        document.getElementById('post-tags').value = post.tags.join(', ');
        document.getElementById('post-content').value = post.content;
        
        // Update modal title
        document.getElementById('modal-title').textContent = 'Edit Post';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('createPostModal'));
        modal.show();
        
        // Hide overlay if open
        this.hidePostDetail();
    }
    
    // Delete post
    deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;
        
        this.posts = this.posts.filter(p => p.id !== postId);
        this.savePosts();
        this.renderPosts();
        this.renderTags();
        
        // Hide overlay if open
        this.hidePostDetail();
    }
    
    // Save post (create or update)
    savePost() {
        const id = document.getElementById('post-id').value;
        const title = document.getElementById('post-title').value.trim();
        const author = document.getElementById('post-author').value.trim();
        const image = document.getElementById('post-image').value.trim();
        const tags = document.getElementById('post-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        const content = document.getElementById('post-content').value.trim();
        
        if (!title || !author || !content) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (id) {
            // Update existing post
            const postIndex = this.posts.findIndex(p => p.id === parseInt(id));
            if (postIndex !== -1) {
                this.posts[postIndex] = {
                    ...this.posts[postIndex],
                    title,
                    author,
                    image: image || null,
                    tags,
                    content
                };
            }
        } else {
            // Create new post
            const newPost = {
                id: Date.now(),
                title,
                author,
                image: image || null,
                date: new Date().toISOString().split('T')[0],
                tags,
                content,
                likes: 0,
                comments: []
            };
            
            this.posts.unshift(newPost);
        }
        
        this.savePosts();
        this.renderPosts();
        this.renderTags();
        
        // Reset form and close modal
        this.resetPostForm();
        const modal = bootstrap.Modal.getInstance(document.getElementById('createPostModal'));
        modal.hide();
    }
    
    // Reset post form
    resetPostForm() {
        document.getElementById('post-form').reset();
        document.getElementById('post-id').value = '';
        document.getElementById('modal-title').textContent = 'Create New Post';
    }
    
    // Export posts as JSON
    exportPosts() {
        const dataStr = JSON.stringify(this.posts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'blog_posts.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Show import modal
    showImportModal() {
        const modal = new bootstrap.Modal(document.getElementById('importModal'));
        modal.show();
    }
    
    // Import posts from JSON file
    importPosts() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file to import');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedPosts = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedPosts)) {
                    throw new Error('Invalid file format');
                }
                
                // Validate posts structure
                const validPosts = importedPosts.filter(post => 
                    post.id && post.title && post.author && post.content
                );
                
                if (validPosts.length === 0) {
                    throw new Error('No valid posts found in the file');
                }
                
                this.posts = validPosts;
                this.savePosts();
                this.renderPosts();
                this.renderTags();
                
                // Close modal and reset file input
                const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
                modal.hide();
                fileInput.value = '';
                
                alert(`Successfully imported ${validPosts.length} posts`);
            } catch (error) {
                alert('Error importing posts: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Utility functions
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    stripMarkdown(text) {
        return text.replace(/[#*`\[\]]/g, '');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogApp();
});
